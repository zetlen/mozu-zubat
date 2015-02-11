# Zubat

<img src="http://pldh.net/media/dreamworld/041.png">

Zubat compresses JavaScript for Mozu themes. The name is too good for just that, so it'll probably be expanded to support other common Mozu theme development activities, like file watching, linting, compression of other resources, publishing, you name it. But here's how it works for now.

## The thing it does

Mozu themes have lots of JavaScript in them to support the fancy, dynamic features of the catalog and commerce pages (think category faceting, product configuration, checkout, your account page). To keep the JavaScript maintainable, extensible, and organized, Mozu themes also use RequireJS (in the form of Mozu-Require) to separate scripts into modules. The downside is that this produces a lot of separate, small files, that at runtime causes a lot of separate, small HTTP requests, resulting in a pretty big performance hit.

Zubat analyzes the dependency tree of your modules (using r.js) and reads any specific build directions you have in your `build.js` file, then uses it to *compile and minify your scripts*, into the `compiled/scripts` directory by default. You can then switch your theme to use the compiled scripts by changing the base URL supplied to Mozu-Require, which the Core4 theme does in `templates/modules/trailing-scripts.hypr`, keyed off the theme setting `useDebugScripts`:

```html
<script src="{{siteContext.cdnPrefix}}/js/require-{% if themeSettings.useDebugScripts %}debug{% else %}min{% endif %}.js"></script>
<script type="text/javascript">
    require.config({
        cdnPrefix: "{{ siteContext.cdnPrefix }}",
        cacheKey: "{{ siteContext.hashString }}",
        urlArgs: "theme={{siteContext.themeId}}&cacheKey={{ siteContext.hashString }}",
        baseUrl: "{{ siteContext.cdnPrefix }}{% if not themeSettings.useDebugScripts %}/compiled{% endif %}/scripts",
        paths: {
            jquery: "//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery{% if not themeSettings.useDebugScripts %}.min{% endif %}"
        },
        priority: ['jquery']
    });
    {% if themeSettings.useDebugScripts %}
    require([{% all_scripts %}]);
    {% else %}
    require(['jquery', 'modules/common'], function() { require([{% all_scripts %}]); });
    {% endif %}
</script>
```

This is a good way to do it and you should do it this way.

## System Requirements

*   Node.js version 0.10 or above. Should work on all platforms.

## Installation

1.  [Download from Github](https://github.com/zetlen/mozu-zubat) either by cloning the repo or downloading the zipfile and unzipping.
2.  Open a Terminal (or in Windows, a command prompt) in the directory.
3.  `npm install -g`

## Usage

Run Zubat with no arguments for usage details.

    $ zubat

    [ERROR] No theme path provided.
    Compress and optimize scripts in a Mozu theme, respecting theme inheritance. 
    Usage: zubat [options] <themePath>

    Options:
        -o, --dest            Specify a destination other than the default /compiled/scripts directory of your theme.                                                                            
        -m, --manualancestry  Specify theme ancestry at the command line instead of analyzing it through theme.json. 
            Example: zubat -m ../parentThemeDir -m ../grandparentThemeDir -m ../Core4
            
        -b, --buildconfig     Specify an alternate location for the build configuration file. Defaults to `build.js`.

        -v, --verbose         Talk a lot.                                                                                                                                                        
        -q, --quiet           Don't talk at all.                                                                                                                                                 
        --version             Print version information and exit.                                                                                                                                

    You must supply a theme path.

    $

Inside a theme directory:

    zubat .

Will build the current theme. **NOTE: If your theme extends Core or any other theme, this currently won't work. You need to specify manual ancestry.**

So, inside a theme directory:

    zubat --manualancestry ../Core4 .

Or for short:

    zubat -m ../Core4 .

If your theme inherits another theme instead of Core4 and its parent theme also inherits, then you'll need to specify the whole ancestry tree. Specify the ancestors in order using the `-m` option multiple times.

    zubat -m ../parenttheme -m ../grandparenttheme -m ../core4 ../themedir

## API

Zubat can be used in Node, which makes it perfect for task runners and other such garbage. Example grunt task follows:

```js
grunt.registerMultiTask('zubat', 'Compile theme JS files using Zubat.', function() {
    var done = this.async(),
    zubat = require('zubat');

    if (!this.data.logLevel) this.data.logLevel = 2;
    
    var job = zubat(this.data.dir, this.data, function() {
      grunt.log.ok('All tasks complete!');
      done(true);
    });

    job.on('log', function(str, sev) {
      switch(sev) {
        case "success":
          grunt.log.ok("zubat: " +str);
          break;
        case "error":
          grunt.log.error("zubat: " +str);
          job.cleanup(function() {
            done(false);
            grunt.fatal("Zubat failed.");
          });
          break;
        case "warning":
          grunt.warn("zubat: " +str);
          job.cleanup(function() {
            done(false);
          });
          break;
        default:
          grunt.verbose.writeln("zubat: " +str);
      }
    });
});
```


