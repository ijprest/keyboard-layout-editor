___Version 0.15:___ Aug 4, 2015
* Now using GitHub Gists for storage:
  * In order to save layouts, you now need to sign in to GitHub via OAuth.
  * Once signed in, clicking 'Save' will store your layout as a GitHub Gist.
    * Unlike before, if you modify your layout and save again, a new 
      _revision_ of your Gist is created.  
    * You can now share a link to your layout and it will be stable over time 
      as you make edits to it.
  * All Gists are created as 'Private'; this means that nobody can see it 
    unless you share the link.
* If you make modifications to another user's layout and try to save, you 
  will be prompted to create a "fork" under your own account.
  * The link between your copy and the original copy is maintained.
  * Note that you can only have one fork of any given layout; if you try
    to fork it a second time, you will end up overwriting your first fork
    (though history is maintained, so you won't lose any data).  This appears
    to be a limitation in how GitHub Gists work.
* Get a list of all your saved layouts; go to 'My Layouts' in the user menu.
* "Star" & "Unstar" your favorite layouts; go to 'Starred Layouts' in the 
  user menu to go back to layouts you previously starred.
* New "background" options:  (Thanks iandoug!)
  * You can now add a background 'texture' to your layout to simulate the 
    look of various materials (e.g., wood, aluminum, etc.).  
  * You can now set the corner radius of your layout to better simulate 
    the look of non-rectangular keyboards. 
* You can now add 'decals' to your layout:
  * These are purely decorative additions to the layout, and have many uses
    (e.g., keyboard logos, 'caps lock' LEDs, labels, etc.)
  * They have many of the same formatting options as regular keycaps, but 
    they don't render any keycap background.

___Version 0.14:___ Aug 1, 2015
* Custom Styles
  * You can now define custom styles for your keyboard using CSS
  * Custom Styles tab is used to edit the style (similar to the Raw-Data tab)
  * This allows you to do some fancy things like change fonts and define
    custom glyphs.
  * CSS is parsed & sanitized to prevent certain types of abuse.
  * Linked to some documentation on the Wiki on how to use the custom styles.
* Character Picker
  * New Character Picker dropdown on the main bar (next to Color Swatches)
  * Displays a grid of characters/glyphs corresponding to the menu option.
  * The list can be filtered/searched to quickly find the glyph you're 
    looking for.
  * Selecting a glyph will show you the HTML-code to put into your legend.  
    Alternatively, you can drag & drop a glyph to any of the legend editors.
  * Created initial glyph sets for the named HTML entities, a bunch of
    combining diacritical marks, and all the Font Awesome icons.
  * You can also show any glyphs defined in your custom stylesheet, so long
    as they adhere to the "Font Awesome" pattern.
* Updated the Commodore VIC-20 sample to use a custom stylesheet
  * Demonstrates how to use your own fonts, and how to create custom glyphs 
    in the correct format so that they appear in the character picker.
* Added a button to swap the primary & secondary rectangles that define an
  oddly-shaped key (like the big-ass Enter, etc.).
  * It's next to the width/height fields, and looks similar to the swap 
    colors button.
  * The actual shape of the keycap is unchanged, but the positioning of
    labels is always based on the primary rectangle, so the button lets you
    quickly toggle between the two options.

___Version 0.13:___ Jul 27, 2015
* Big changes to the UI for entering text legends:
  * Nobody understood the centering checkboxes... they're gone now.
  * You can now put text legends in any position, in any combination.
  * You can override the color & font-size on any legend, in any combination.
  * The alignment flags are still used in the raw-data; should be fully
    backwards-compatible with your old saved layouts.
* Added the ability to make keys into "homing" keys, which usually adds a "nub"
  to the key, except in SA/DSA where they render as a deep-dish key.
* SA profile rendering tweaked to be slightly different from DSA (sits higher)
* New OEM profile (renders the same as DCS).
* Experimental SVG export!
  * No text labels, no homing-key support, not to scale
* Fixed an issue generating bad permalinks (#83).
* A bunch of under-the-hood changes to the code & engineering process to make
  future changes easier.

___Version 0.12:___ Jul 5, 2015
* Added the ability to set different colors on each label.
  * Useful for certain foreign-language keyboards that have multi-colored
    legends.
  * The first label supplies the 'primary' color; any label that hasn't
    overridden the color will use the first one.
* New color picker (more browser support than input type="color").
  * Added color picker beside each label field.
* Can also drag from the palette to each of the label fields.
* Added a simple 'Options' dialog; contains options to change the default
  move/size/rotate step sizes.
* New keyboard metadata fields: Keyboard Name, Author, and Notes
* Fixed a couple of serialization issues dealing with rotated clusters (#57, #61)
* Updated to newer versions of various libraries (Bootstrap, etc.)
* Some behind-the-scenes refactoring to improve code quality and maintainability.

___Version 0.11:___ Jul 1, 2015
* Added ability to upload & download raw data in JSON format
  * This is "real" JSON, not the lenient JSON that the raw-data editor uses
  * To upload, you can either use the 'upload' button, or drag & drop to either
    the raw-data editor, or the main keyboard preview area.
* Added link to raw-data syntax from the raw-data tab.
* Added links to CHANGELOG, CONTRIBUTORS, and LICENSE files.
* Pressing F1 now shows the help screen.
* Fixed bug #81, where the first key in the layout could not be smaller than 1x1.
* Added YBX to the "Signature Plastics PBT" color palette (fixes #79).
  * Note that I don't have a physical color chip, so I couldn't sample the
    color as accurately as the other Signature Plastics colors.  The color name
    reflects this.
* Added WASD keyboard colors (thanks gioele!).  Fixes #62.
* Added a favicon to the site.
* Fixed an issue where bad HTML in a label field would prevent the editor from
  rendering properly (fixes #65).
  * If bad HTML is used, we now display a little 'X' in the label, with a
    helpful tooltip.
* Added preliminary support for "homing" keys. (Thanks, D1SC0tech!)
  * Add "HOMING" to the profile/row field.
  * Currently only supported for DSA (it renders as a deep-dish key); other
    profiles will be added in a future update.
  * Updated the "GB: Retro DSA" sample to demonstrate the effect.
* Added a number of new keyboard presets/samples sent in by users:
  * Atreas keyboard (thanks domgetter!)
  * Default 60%, Keycool 84, Leopold FC660m (thanks, rswiernik!)
  * VIC-20 (thanks BlueNalgene!)
  * Kinesis Advantage (thanks alerque!)

___Version 0.10:___ Nov 12, 2013
* Added support for rotated key clusters.
  * Each key has a rotation angle and center-of-rotation.
  * Keys with the same angle/CoR are grouped together into a "custer" for the
    purposes of sorting the keys, and in the serialized format; e.g.,
    navigating to the next/previous key will go through all the keys in the
    current cluster before moving on to the next cluster.
  * Crosshairs-indicator displays in the editor to let you know where your
    center-of-rotation is.
  * Keyboard:  Ctrl+Arrows to modify the center-of-rotation; PgUp/PgDn to
    modify the rotation angle.
  * __CAUTION:__ it's really easy to get confused, and end up with keys
    outside the visible area; I recommend setting your center-of-rotation
    _before_ rotating the keys.  But you can always "undo" if you mess up.
* Added rendering rules for the SA keycap profile.
  * Currently renders exactly like DSA.
* Fixed the rendering of profile-gradients on non-rectangular keys.
  * Works perfectly on DCS profile.
  * Works about as well as possible on DSA/SA. Doesn't look jarring, at least.
* Added a "center-stepped" key to the "Add Key" dropdown menu.
* Some performance improvements.
* Added a new preset: ErgoDox
* Added a new sample: Symbolics PN 364000
* Fixed the usual smattering of bugs, and no doubt introduced a bunch more...

___Version 0.9:___ Nov 9, 2013
* Updated editor with new Signature Plastics color swatches.
  * ABS colors updated; PBT colors added.
  * Colors were sampled from actual plastic chips using an X-Rite ColorMunki,
    and then converted to sRGB (D65) using the formulas on Bruce Lindbloom's
    website.
  * Colors are accurate is your monitor is calibrated to sRBG!
* More accurate (?) colors for the tops of the keycaps.
  * Previously, the color you entered would be used directly on the top of
    the cap, and then "darkened" for the sides.
  * However, our colors were sampled from the "smooth" part of the chip.
  * Since the sides of a cap are usually smooth, and the top of the cap is
    usually matte (which tends to reflect more light, appearing brighter), it
    made sense to switch things around.
  * Now using the color verbatim on the *sides* of the cap, and using a
    "lighter" color for the top of the cap.
  * Computing the "lighter" color in LAB space (instead of RGB space).
  * Tweaked the gradients for DSA/DCS, and updated the various samples and
    default colors to work better with the new rendering.
* Added a little "indicator" to the palette to indicate which color is
  being used for the keycap (and label).
  * Also, printing the currently-selected color name beside the color-editor
    fields.
* Added a button to swap the keycap and label colors; should make creating
  some color schemes (e.g., CCnG) really easy.
* Sanitizing any HTML tags entered into key labels.
  * I wasn't so much worried about my site since there's no server-side
    component to attack, I don't use cookies, passwords, or personal-data for
    anything, and XSS rules should prevent anything too egregious.
  * But (in theory, at least) users could be given a link to a "malicious"
    keyboard layout, and then maybe tricked into doing something bad.
* Adding "SPACE" to the profile field will now render spacebars with a
  vertical gradient (so long as the profile is supported). e.g., the profile
  string should read something like this: "DCS SPACE R1" (or similar).
* Stepped keycaps are a little more user-friendly.
  * When first creating a stepped cap, I automatically modify the widths to
    make it obvious what's going on.
  * The secondary width/height fields are no longer force-synced for stepped
  	caps.
* Added a link to the GitHub issues page, so users can submit bug reports.
* Added a new sample: Televideo TS-800a
* Fixed the usual smattering of bugs, and no doubt introduced a bunch more...

___Version 0.8:___ Oct 19, 2013
* Switched to a new JSONL parser; generates better error messages, and doesn't
  get hung up on strings with colons in them.
* Increased the number of font-sizes available; now 1-9.  New sizes are more
  linear (for DSA profile).
* Support a 3rd (middle) row of text on the keycaps, to support some layouts
  (e.g., German) that have lots of different legends.
* Support both a primary & secondary font-size on the caps.
  * Primary is used for the first label; secondary for everything else.
* HRs now rendered in key legends if used.
* Added tooltips for most of the editor fields.
* Added support for 'stepped' keycaps.
  * Added a 'stepped caps-lock' to the 'Add Key' dropdown.
* Split the 'Load Preset' menu into two sections.
  * The first section is for true "presets"---standard layouts without much
    customization that serve as a base for the user.
  * The second section is for "samples"; these are layouts with more extensive
    changes, to serve as examples of what is possible in the editor.
  * Added a couple more samples to the list.
* Fixed the usual smattering of bugs, and no doubt introduced a bunch more...

___Version 0.7:___ Oct 14, 2013
* Can specify a background color for the editor (to better visualize the
  caps on, e.g., a black keyboard).
* Added the ability to have right-aligned text (upper- & lower-right)... this
  is useful for some foreign layouts that have lots of legends on the keys.
* Added the ability to have side-printed legends on the front of the caps
  (e.g., for "stealth" keyboards, or for media keys legends).
* Added the ability to have centered legends (either horizontally, vertically,
  or both).
* Added the ability to vary the font height (relative sizes from 1-5; default
  3); some sets (e.g., Retro DSA) have larger legends on certain keys.
* Can now specify the 'profile' of a key:
  * You can currently type anything you want here, and it'll be remembered on
    a per-key basis.  I envision this field eventually being used to specify
    both the profile & the row number (e.g., "DCS R1", or something).
  * I've currently got experimental rendering support if you enter "DCS" or
    "DSA"... I'm just adjusting the margins and adding a subtle gradient to
    make it look cylindrical or spherical. It doesn't work very well on
    oddly-shaped keys, though.
  * If you specify DSA, I'm also switching the font to "Engravers Gothic";
    this isn't a perfect match for the "Gorton Modified" that SP uses, but
    it's reasonably close for most glyphs.
* Fixed the usual smattering of bugs, and no doubt introduced a bunch more...

___Version 0.6:___ Oct 13, 2013
* Can now SAVE a copy of your layout to the server
  * You get a nice, shortened URL to use to retrieve your layout later.
  * All layouts are public... if somebody has the link, they can view your
    layout.
  * Also, there isn't too much security... it would be technically possible
    for someone to upload a "blank" layout over top of an existing layout
    (provided they had the link)... however I've got versioning enabled on
    the server, so if this every happens to you, I can probably retrieve your
    old layout.
  * I reserve the right to occasionally purge layouts, so I recommend you
    maintain a bookmark of the permalink to anything important, just in case.
    (I'm only likely to do this if it looks like there was some sort of attack
    on the server, or other form of abuse, and would try to only delete
    layouts that didn't look "finished". But still... backups are
    recommended.)
* Added the ability to "ghost" a keycap:
  * Ghosted keys are dimmed out.
  * This is useful for drawing attention to the *unghosted* keys, while still
    presenting them in context.
* Added copy/paste support:
  * Unfortunately, the browser does not expose the clipboard to web-pages in
    any useful manner...
  * There are a few workarounds I could pursue using Flash applets and such,
    but they have their own limitations (in addition to requiring Flash).
    I've got my eye out for other suitable workarounds, but until then... the
    cut/paste is internal to the current instance of the editor (you can't,
    e.g., copy from one instance and paste into another).
* Added a warning if you try to navigate away from the editor without having
  saved your work.
* Added some very-crudely sampled GMK color swatches (from sherryton's photo).
* Plus, the usual smattering of bug-fixes.

___Version 0.5:___ Sept 29, 2013
* Undo/redo support!
* Switched to URLON-encoding for the permalinks... since it mostly uses
  URL-safe characters, it results in significantly shorter URLs.
  * I'm not 100% sold on this... it still results in pretty ugly links. But at
    least they're shorter.
  * Note that the old permalinks should still work (since the data format
    didn't change... just the encoding).
* Alt+click is now allowed wherever Ctrl+Click was previously allowed (helpful
  for Mac users who can't Ctrl+Click).
* Shift+click will now "extend" the selection (linearly, in left-to-right
  fashion).
* Similarly, Shift+J/K will extend the selection.
* Ctrl+A will select all keys; ESC will de-select all.
* A couple of small bugfixes.

___Version 0.4:___ Sept 28, 2013
* Miscellaneous bug fixes and UI tweaks.
* Marquee select a bit easier to use, since it continues to track the mouse
  anywhere over the browser window.
* I've added pre-baked "ISO Enter" and "J-Shaped Enter" keys to the "Add Keys"
  dropdown.
* "Help" dialog to show available keyboard shortcuts.
* Code now on GitHub for proper versioning and stuff.

___Version 0.3:___ Sept 24, 2013
* New capabilities:
  * Can now change the text color of a keycap.
  * Can select a 'palette' of colors from the dropdown at the top (currently
    only showing Signature Plastics ABS colors, but others can be added
    easily); clicking a swatch sets the cap color, ctrl+click sets the text
    color.
* Better keyboard/mouse support:
  * Shift+Arrows to change width/height of the selected keycap.
  * F2 when the keyboard-layout has focus will send focus to the
    properties-editor.
  * ESC when the properties-editor has focus will send focus to the
    keyboard-layout.
  * No longer need to hold the 'Alt' key to marquee-select keys.
  * Some common operations (add button, etc.) will automatically focus the
    keyboard-editor, for more seamless keyboard use.
* UI changes:
  * Using Bootstrap for a cleaner and more-consistent look & feel.
  * Keyboard presets moved into a dropdown in the top nav-bar.
  * 'permalink' moved to the right side of the nav-bar.
  * "Add/Delete Key" buttons are moved above the keyboard-editor.
  * "Add Key" button has a dropdown, with options to add more than one key at
    a time.
  * I am now 'disabling' the UI fields instead of hiding them completely;
    stuff 'jumps around' less.
  * Raw data editor is now on a different 'tab', to get it out of the way of
    the rest of the UI
  * Raw data editor now reports if you type invalid data.
* Data changes:
  * The data format hasn't actually changed (permalinks from the last version
    will still work), but I've made a few changes to simplify it and present
    it better.
  * I'm using a "non-strict" JSON variant that doesn't require quotes around
    property names... so there's a lot less "noise" in the data, and it makes
    it easier for a human to read and understand.
  * The raw-data editor strips off the leading & trailing square brackets
    (they're still in the permalink, though).
  * The raw-data editor splits "rows" onto separate lines, further enhancing
    readability.

___Version 0.2:___ Sept 21, 2013
* Exposed the raw JSON data for easier hand-editing.
  * This is probably the fastest way to add the key labels.
  * Updates after a short delay (i.e., not on every keystroke)
* Major performance improvements.
  * I was bumping into limits with the number of AngularJS "watches" I had;
    refactored to bring this down dramatically.
* Can now do a "marquee select" by holding down 'alt' and dragging a marquee
  rectangle.
  * Alt+Ctrl+drag will "add" the new rectangle to the existing selection
  * Can still Ctrl+click a single key to toggle its selection state
* When the "keyboard" has focus, the following hotkeys are available:
  * Arrow keys: move the selected keys (and does what you expect when
    multiple keys are selected).
  * J/K: select the previous/next key
  * Insert/Delete: add new keys, or delete selected keys.
* No longer sticking the data in the URL address
  * I found this would really bog down the browser when you were updating
    frequently.
  * There's a "permalink" link at the bottom of the page that can still
    be used to save/bookmark a layout.
* Inserting new keys is a little smarter...
  * doesn't just dump them all down the left
  * new key is auto-selected
* Deleting keys will now automatically select the next key.

___Version 0.1:___ Sept 18, 2013
* Initial release.
* Can specify basic size, position, and label of each keycap.
* Entirely self contained in the ~13k HTML file (except for JQuery &
  AngularJS).
  * Keys rendered with HTML DIVs.
  * The "serialized" format (which is JSON) is transformed to an in-memory
    format (also JSON). The primary difference being that the serialized
    version is optimized for size, and the in-memory format for rendering.
  * The non-rectangular keys were an interesting problem. My solution is
    workable, but they're cumbersome and non-intuitive to edit.
