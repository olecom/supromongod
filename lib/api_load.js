/*
 */

module.exports = function api_load(api, cfg){
var url = require('url')
   ,fs = require('fs')
   ,qs = require('connect/node_modules/qs')
   ,ui_api, local

    local = {
        url: null,
        cfg: cfg,
        require:{
        }
    }
    ui_api = {
        'api': null,
        'dev': load_api
    }
    load_api()

    return mwAPI
    // TODO: make this load/reload part common
    function mwAPI(req, res, next){
    var ret = { success: true, data: null, err: null }// for errors: `return next(err)`
       ,call//                                                        \.../
       ,m = req.url.slice(1, 4)// call from UI: App.backend.req('?/lib/dev')

        __res = res

        if('dev' === m && false /*req.session && !req.session.can['App.view.Window->tools.refresh']*/){
            res.statusCode = 401// no auth
            return next('!auth')
        }//           leave '?/lib/api/log' -> '/log' for subapi call
        local.url = url.parse(req.url.slice(4))// parse into object, api has no `require()`
        local.url.query && (local.url.query = qs.parse(local.url.query))

        call = ui_api[m]
        if(call){
            if(!call(ret, api, local, req, res, next)){// try/catch by `connect`
                return res.json(ret)// sync
            }// async
        } else {
            return next('!handler: ' + req.url)// sync no handler
        }
        return undefined
    }

    function load_api(ret){
    var m, tmp, err = '', done = ''

        for(m in ui_api){
            if(0 != m.indexOf('dev')){
                tmp = ui_api[m]// save
                try {
                    ui_api[m] = new Function(
                       'ret, api, local, req, res, next', 'return ' +
                        fs.readFileSync(__dirname + '/' + m + '.js', 'utf8')
                    )
                    done += m + ' '
                } catch(ex){
                    log('exec fail:', ex)
                    err += ex + '\n'
                    tmp && (ui_api[m] = tmp)// restore if error
                }
            }
        }
        if(ret){
            ret.data = done
        }
        return err && arguments[5] && (arguments[5](err) || true)// next(err), async subapi
    }
}
