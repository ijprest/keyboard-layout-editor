keyboard-layout-editor
----------------------
[Keyboard-layout-editor.com](http://www.keyboard-layout-editor.com) (KLE) is a web
application that enables the editing of keyboard-layouts, i.e., the position
and appearance of each physical key.

The motivation for creating this application was a custom keyboard I was 
designing.  I wanted to be able to experiment quickly with different possible
layouts and visualize them easily.  The existing graphics tools were capable
enough, but cumbersome to use for this specific task.

As I sank further into the keyboard-enthusiast scene, I became aware of 
custom keycap sets that were being created by and for other enthusiasts. The
ability to specify various details of the visual-appearance of the keycaps
is an attempt to render these custom keycap sets as accurately as possible
(within the constraints of HTML/CSS).

Want to interop with with KLE?  Check out sister-project 
[kle-serial](https://github.com/ijprest/kle-serial), which includes code to
deserialize saved layouts.

Links
-----
* [Changelog](CHANGELOG.md)
* [Contributors](CONTRIB.md)
* [License](LICENSE.md)

Getting Started for Developers
------------------------------
Want to play around with the source?  Install the tools, clone the repository,
then build / test.

Required Tools:

* NodeJS/NPM: https://nodejs.org/
* GNU Make: http://www.gnu.org/software/make/
* FontForge: http://fontforge.github.io/en-US/
* Bower: ```npm install -g bower```
* Grunt: ```npm install -g grunt-cli```
* Protractor: ```npm install -g protractor```
* Jasmine: ```npm install -g jasmine```
* Uglifyjs: ```npm install -g uglifyjs```
* Stylus: ```npm install -g stylus```
* Jison: ```npm install -g jison```
* Git-utils: ```npm install git-utils -g ```

Installing prerequisite components (once):

* ```make install```

Build:

* ```make```
* ```make fonts```

Test:

* ```webdriver-manager update```
* ```webdriver-manager start```
* ```make test```

Notes:

* You can use any HTTP server for local development; I'm using an ancient
  version of [Mongoose](https://cesanta.com/mongoose.shtml), but whatever 
  you've got handy should work.
* However, if you want to be able to log in to GitHub via OAuth (without
  hacking up the code and registering your own OAuth application), you will
  need to put the server at: http://localhost:8080/
