/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>',

    meta: {
      banner: '/*\n  <%= pkg.title || pkg.name %> <%= pkg.version %>' +
      '<%= pkg.homepage ? " <" + pkg.homepage + ">\n" : "" %>' +
      '  Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>' +
      '\n\n  Released under <%= _.pluck(pkg.licenses, "type").join(", ") %> License\n*/',
      browser: {
        pre: '(function(global, undefined){\n"use strict";\n',
        post: '})(window);'
      }
    },

    lint: {
      files: ['<config:concat.browser.dest>']
    },

    concat: {
      browser: {
        src: [
          '<banner:meta.banner>', 
          '<banner:meta.browser.pre>',
          'reader.js',
          'parseCSS.js',
          '<banner:meta.browser.post>'
        ],
        dest: 'bin/parseCSS.js'
      }
    },

    min: {
      browser: {
        src: ['<banner:meta.banner>', '<config:concat.browser.dest>'],
        dest: 'bin/parseCSS.min.js'
      }
    },

    watch: {
      files: '<config:lint.files>',
      tasks: 'lint'
    },

    jshint: {
      options: {
        curly: false,
        boss: true,
        evil: true,
        browser: true,
        node: true
      },
      globals: { }
    },

    uglify: {}
  });

  grunt.registerTask('default', 'concat lint min');
};
