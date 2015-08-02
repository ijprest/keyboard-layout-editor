keyboard-layout-editor
----------------------
[Keyboard-layout-editor.com](http://www.keyboard-layout-editor.com) is a web
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

Links
-----
* [Changelog](CHANGELOG.md)
* [Contributors](CONTRIB.md)
* [Backgrounds](BACKGROUND.md)
* [License](LICENSE.md)

Getting Started for Developers
------------------------------
Want to play around with the source?  Install the tools, clone the repository,
then build / test.

Required Tools:

* NodeJS/NPM: https://nodejs.org/
* GNU Make: http://www.gnu.org/software/make/
* Bower: ```npm install -g bower```
* Grunt: ```npm install -g grunt-cli```
* Protractor: ```npm install -g protractor```
* Uglifyjs: ```npm install -g uglifyjs```
* Stylus: ```npm install -g stylus```
* Jison: ```npm install -g jison```
* Git-utils: ```npm install git-utils -g ```
* FontForge

Installing prerequisite components (once):

* ```make install```

Build:

* ```make```

Test:

* ```webdriver-manager update```
* ```webdriver-manager start```
* ```make test```
