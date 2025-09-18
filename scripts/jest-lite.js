const fs = require('fs')
const path = require('path')
const Module = require('module')
const ts = require('typescript')
const util = require('util')

// Register a simple TypeScript loader for test files and source modules.
const tsExtensions = ['.ts', '.tsx']
for (const ext of tsExtensions) {
  require.extensions[ext] = (module, filename) => {
    const source = fs.readFileSync(filename, 'utf8')
    const transpiled = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2019,
        esModuleInterop: true,
        jsx: ts.JsxEmit.React,
        moduleResolution: ts.ModuleResolutionKind.Node10,
        allowJs: true,
      },
      fileName: filename,
    })

    module._compile(transpiled.outputText, filename)
  }
}

const originalLoad = Module._load
const mockFactories = new Map()
const mockCache = new Map()

Module._load = function patchedLoad(request, parent, isMain) {
  if (mockFactories.has(request)) {
    if (!mockCache.has(request)) {
      const factory = mockFactories.get(request)
      mockCache.set(request, factory())
    }
    return mockCache.get(request)
  }

  const resolved = (() => {
    try {
      return Module._resolveFilename(request, parent)
    } catch {
      return null
    }
  })()

  if (resolved && mockFactories.has(resolved)) {
    if (!mockCache.has(resolved)) {
      const factory = mockFactories.get(resolved)
      mockCache.set(resolved, factory())
    }
    return mockCache.get(resolved)
  }

  return originalLoad.call(this, request, parent, isMain)
}

const createdMocks = []

function createMockFunction(implementation) {
  let impl = implementation
  const mockFn = function (...args) {
    const fn = impl || (() => undefined)
    const value = fn.apply(this, args)
    mockFn.mock.calls.push(args)
    mockFn.mock.results.push({ type: 'return', value })
    return value
  }

  mockFn.mock = {
    calls: [],
    results: [],
  }

  mockFn.mockReturnValue = (value) => {
    impl = () => value
    return mockFn
  }

  mockFn.mockImplementation = (newImpl) => {
    impl = newImpl
    return mockFn
  }

  mockFn.mockReset = () => {
    mockFn.mock.calls = []
    mockFn.mock.results = []
    impl = implementation
    return mockFn
  }

  createdMocks.push(mockFn)
  return mockFn
}

const jestApi = {
  fn: createMockFunction,
  mock(moduleName, factory) {
    mockFactories.set(moduleName, factory)
  },
  clearAllMocks() {
    for (const mock of createdMocks) {
      if (typeof mock.mockReset === 'function') {
        mock.mockReset()
      }
    }
  },
}

global.jest = jestApi

function createExpect(received) {
  const expectation = {
    toBe(expected) {
      if (received !== expected) {
        throw new Error(`Expected ${expected} but received ${received}`)
      }
    },
    toEqual(expected) {
      if (!util.isDeepStrictEqual(received, expected)) {
        throw new Error(`Expected ${JSON.stringify(received)} to equal ${JSON.stringify(expected)}`)
      }
    },
    toHaveBeenCalled() {
      if (!received || !received.mock || received.mock.calls.length === 0) {
        throw new Error('Expected function to have been called')
      }
    },
    toHaveBeenCalledTimes(expected) {
      const actual = received && received.mock ? received.mock.calls.length : 0
      if (actual !== expected) {
        throw new Error(`Expected function to have been called ${expected} times, but was called ${actual} times`)
      }
    },
    toHaveBeenCalledWith(...expectedArgs) {
      if (!received || !received.mock) {
        throw new Error('Expected a mock function')
      }

      const calls = received.mock.calls
      const matched = calls.some((call) => util.isDeepStrictEqual(call, expectedArgs))
      if (!matched) {
        throw new Error(
          `Expected function to have been called with ${JSON.stringify(expectedArgs)}, but received calls ${JSON.stringify(calls)}`,
        )
      }
    },
    get not() {
      return {
        toHaveBeenCalled() {
          if (received && received.mock && received.mock.calls.length > 0) {
            throw new Error('Expected function not to have been called')
          }
        },
      }
    },
  }

  return expectation
}

global.expect = createExpect

const tests = []
const suiteStack = [{ nameParts: [], beforeEachFns: [] }]

global.describe = (name, fn) => {
  const parent = suiteStack[suiteStack.length - 1]
  const context = {
    nameParts: parent.nameParts.concat(name),
    beforeEachFns: parent.beforeEachFns.slice(),
  }
  suiteStack.push(context)
  fn()
  suiteStack.pop()
}

global.beforeEach = (fn) => {
  const context = suiteStack[suiteStack.length - 1]
  context.beforeEachFns.push(fn)
}

global.it = global.test = (name, fn) => {
  const context = suiteStack[suiteStack.length - 1]
  tests.push({
    name: context.nameParts.concat(name).join(' '),
    fn,
    beforeEachFns: context.beforeEachFns.slice(),
  })
}

function collectTestFiles(startDir) {
  const collected = []

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const entryPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(entryPath)
      } else if (/\.test\.(t|j)sx?$/.test(entry.name)) {
        collected.push(entryPath)
      }
    }
  }

  walk(startDir)
  return collected
}

const projectRoot = path.resolve(__dirname, '..')
const testDirectory = path.join(projectRoot, 'src')
const testFiles = collectTestFiles(testDirectory)

if (testFiles.length === 0) {
  console.log('No tests found.')
  process.exit(0)
}

for (const file of testFiles) {
  require(file)
}

async function run() {
  let failures = 0

  for (const { name, fn, beforeEachFns } of tests) {
    try {
      for (const setup of beforeEachFns) {
        await setup()
      }
      await fn()
      console.log(`✓ ${name}`)
    } catch (error) {
      failures += 1
      console.error(`✗ ${name}`)
      console.error(error && error.stack ? error.stack : error)
    }
  }

  if (failures > 0) {
    process.exit(1)
  }
}

run()
