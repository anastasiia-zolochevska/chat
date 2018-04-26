var mocha = require('mocha');
var chai = require('chai');
var sinon = require('sinon');
var assert = chai.assert;
var expect = chai.expect;

//A basic test
describe("My First Test Suite", function () {
  it("introduces a test suite", function () {
    expect(true).to.equal(true);
  });
});
