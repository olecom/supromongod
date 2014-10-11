/*
 * Run `mongod` and connect to it
 **/

module.exports = supromongod

function supromongod(api, cfg){
var app = api.app, name = 'supromongod'
   ,path = require('path')

    cfg.db_path = path.normalize(
        //  $PWD/app_modules/supromongod/ -> $PWD/data/supromongod/
        __dirname + '/../..' + (cfg.db_path || '/data/supromongod/')
    )
    if(cfg.bin){
        cfg.bin = path.normalize(__dirname + '/' + cfg.bin)
    }
    require('./lib/mongodb.js')[cfg.bin ? 'launch' : 'connect'](
        api, cfg
    )

    /* == admin/status UI && API: == */
    if(!cfg.rbac){
        cfg.rbac = { can: { }}
    } else if(!cfg.rbac.can){
        cfg.rbac.can = { }
    }
    // add `can` for toolbar with daemon handlers
    cfg.rbac.can['App.supromongod.view.ControlTools'] = true
    cfg.rbac.can['/supromongod/lib/'] = true

    return {
        css:['/css/' + name + '/css'],
        js: ['/' + name + '/app_front_' + name ],
        app_use: app_use,// call this *after* `mwBasicAuthorization()`
        cfg: cfg
    }

    function app_use(){
        app.use('/' + name + '/lib/', require('./lib/api_load.js')(api, cfg))
        // order of priority; serve static files, css, l10n
        app.use('/' + name + '/', api.connect['static'](__dirname + '/'))
        app.use('/l10n/', api.mwL10n(api, __dirname, '_' + name + '.js'))
        app.use('/css/' + name + '/', api.connect['static'](__dirname + '/css/'))
        app.use('/css/' + name + '/css', api.connect.sendFile(
            __dirname + '/' + name + '.css', true)
        )
    }
}
