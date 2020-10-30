/* global describe, it */

'use strict'

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const Enumeration = require('@northscaler/enum-support')

const { extractDtoFromEntityAsync } = require('../../../main').service

describe('unit tests of extractDtoFromEntityAsync', () => {
  it('should work', async function () {
    const Boolean = Enumeration.new({ name: 'Boolean', values: ['TRUE', 'FALSE'] })
    const date = '2020/1/1'
    const entity = {
      _zero: false,
      _one: 1,
      _two: {
        three: 3, // throw one in that doesn't have the _ prefix
        _four: null,
        _five: undefined,
        _six: [6, -6, {
          _nine: 9
        }],
        _seven: new Date(date)
      },
      _eight: it => it,
      _ten: Boolean.TRUE
    }
    Object.defineProperty(entity, 'one', {
      get: function () { return this._one },
      set: function (v) { this._one = v }
    })

    expect(await extractDtoFromEntityAsync(entity)).to.deep.equal({
      zero: false,
      one: 1,
      two: {
        three: 3,
        four: null,
        five: undefined,
        six: [6, -6, { nine: 9 }],
        seven: new Date(date).toISOString()
      },
      ten: Boolean.TRUE.name
    })

    expect(await extractDtoFromEntityAsync(entity, {
      keyReplacementRegEx: null,
      dateFormatter: it => `date:${it.toISOString()}`,
      enumerationFormatter: it => it.ordinal
    })).to.deep.equal({
      _zero: false,
      _one: 1,
      _two: {
        three: 3,
        _four: null,
        _five: undefined,
        _six: [6, -6, { _nine: 9 }],
        _seven: 'date:' + new Date(date).toISOString()
      },
      _ten: 0
    })
  })

  it('should work with additional property names', async function () {
    class Entity {
      constructor () {
        this.foo = Math.random()
      }

      set foo (value) { this._foo = value }

      get foo () { return this._foo }

      get bar () { return 'bar-' + this.foo }
    }

    const f = new Entity()
    expect(await extractDtoFromEntityAsync(f)).to.deep.equal({ foo: f.foo })
    expect(await extractDtoFromEntityAsync(f, {
      additionalPropertyNames: ['bar']
    })).to.deep.equal({ foo: f.foo, bar: 'bar-' + f.foo })
  })
})
