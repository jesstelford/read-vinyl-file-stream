/* jshint node: true, mocha: true */

var expect = require('chai').expect;

var File = require('vinyl');
var ns = require('node-stream');
var through = require('through2');

var readFiles = require('../');

function fileBuffer(opts) {
    opts = opts || {};

    return new File({
        contents: new Buffer(opts.content || 'fake file'),
        path: opts.path || Math.random().toString(36).slice(2) + '.txt',
        base: __dirname
    });
}

function fileStream(opts) {
    opts = opts || {};

    var stream = through();

    setImmediate(function () {
        stream.write(new Buffer(opts.content || 'fake file'));
        stream.end();
    });

    return new File({
        contents: stream,
        path: opts.path || Math.random().toString(36).slice(2) + '.txt',
        base: __dirname
    });
}

describe('[index]', function () {
    it('iterates all files', function (done) {
        var input = through.obj();
        var CONTENT = Math.random().toString(36);

        var count = 0;

        var output = input.pipe(readFiles(function (content, file, stream, cb) {
            count += 1;

            expect(content).to.equal(CONTENT);

            cb();
        }));

        ns.wait.obj(output, function (err, data) {
            expect(err).to.equal(null);
            expect(data).to.be.an('array').and.to.have.lengthOf(0);

            expect(count).to.equal(3);

            done();
        });

        input.push(fileBuffer({
            content: CONTENT
        }));
        input.push(fileBuffer({
            content: CONTENT
        }));
        input.push(fileBuffer({
            content: CONTENT
        }));
        input.end();
    });

    it('can write content back to the stream', function (done) {
        var input = through.obj();
        var CONTENT = Math.random().toString(36);

        var output = input.pipe(readFiles(function (content, file, stream, cb) {
            cb(null, CONTENT);
        }));

        ns.wait.obj(output, function (err, data) {
            expect(err).to.equal(null);
            expect(data)
                .to.be.an('array')
                .and.to.have.lengthOf(1)
                .and.to.deep.equal([CONTENT]);

            done();
        });

        input.push(fileBuffer());
        input.end();
    });

    it('exposes the original stream, so you can push whatever you want', function (done) {
        var input = through.obj();
        var CONTENT = Math.random().toString(36);

        var output = input.pipe(readFiles(function (content, file, stream, cb) {
            stream.push('a');
            stream.push('b');
            stream.push('c');
            stream.push('d');

            cb();
        }));

        ns.wait.obj(output, function (err, data) {
            expect(err).to.equal(null);
            expect(data)
                .to.be.an('array')
                .and.to.deep.equal(['a', 'b', 'c', 'd']);

            done();
        });

        input.push(fileBuffer());
        input.end();
    });

    it('can optionally read streams', function (done) {
        var input = through.obj();
        var CONTENT = Math.random().toString(36);

        var output = input.pipe(readFiles(function (content, file, stream, cb) {
            expect(content).to.equal(CONTENT);

            cb();
        }));

        ns.wait.obj(output, function (err, data) {
            expect(err).to.equal(null);

            done();
        });

        input.push(fileStream({
            content: CONTENT
        }));
        input.end();
    });

    it('skips null vinyl files', function (done) {
        var input = through.obj();
        var CONTENT = Math.random().toString(36);

        var called = false;

        var output = input.pipe(readFiles(function (content, file, stream, cb) {
            called = true;
            cb();
        }));

        ns.wait.obj(output, function (err, data) {
            expect(err).to.equal(null);

            expect(called).to.equal(false);

            done();
        });

        input.push({
            isNull: function () {
                return true;
            }
        });
        input.end();
    });

    it('skips unknown vinyl files', function (done) {
        var input = through.obj();
        var CONTENT = Math.random().toString(36);

        var called = false;

        var output = input.pipe(readFiles(function (content, file, stream, cb) {
            called = true;
            cb();
        }));

        ns.wait.obj(output, function (err, data) {
            expect(err).to.equal(null);

            expect(called).to.equal(false);

            done();
        });

        function no() {
            return false;
        }

        var file = fileBuffer();
        file.isNull = no;
        file.isStream = no;
        file.isBuffer = no;

        input.push(file);
        input.end();
    });

    it('handles errors from the iterator callback');

    it('handles errors from reading a vinyl stream file');
});
