#D1SC0tech Editor
######A fork of [keyboard-layout-editor](https://github.com/ijprest/keyboard-layout-editor) by Ian Prest

[![Join the chat at https://gitter.im/D1SC0tech/keyboard-layout-editor](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/D1SC0tech/keyboard-layout-editor?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

[D1SC0tech Editor](http://d1sc0tech.github.io/keyboard-layout-editor/kb.html) is a web
application for designing custom layouts for mechanical keyboards.

###Credits:
- @ijprest for the original project and all the work that went into it
- @amj for a bunch of great SVG code
- @BlueNalgene for the Commodore layout
- @domgetter for the Atreus layout
- @gcollic for the WASD Keyboards palette
- @rswiernik for some standard layouts

TODO:
- [ ] Add load/save buttons for JSON files, and remove the server save (for now)
- [x] Format raw data as correct JSON (names must be escaped)
- [ ] Add fields for keyboard metadata
- [ ] Keyboard layers. Add multiple function layers and flip between them with a selector
- [ ] Key counter (e.g. "12 Total: 1u x5, 1.25u x7")
- [ ] Keyboard layout image export (SVG/PNG/PDF?)
- [ ] Native support for Swill's Plate Builder
- [ ] CSS for proper sculpted SA profile
- [x] CSS for deep dish keycaps
- [ ] CSS for homing bump keycaps
- [ ] More profiles like SP G20 and Cherry
- [ ] Update/check color palettes
- [ ] Support for custom fonts/sizes
- [ ] Better interface for graphical legends (SVG/PNG icon chooser)
- [ ] Configurable switches (Cherry MX, Gateron, Alps, etc)
- [ ] Configurable LED colors
- [ ] Fix save to include rx/ry rotation origin
- [x] Get stepsize working (ie make the moving a variable instead of 0.25 keysize)
- [x] Get anglestep working (likewise, instead of 15 degrees)
- [ ] Branding?
- [ ] Hide SVG controls when SVG mode is off
