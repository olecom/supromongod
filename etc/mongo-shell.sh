#!/bin/sh
# NOTE: "host" is hardcoded to '127.0.0.1',
#       "port" is 27727 or $NODEJS_CONFIG.supromongod.port
# DB name is taken from $NODEJS_CONFIG or $1
set -e

trap 'echo "
Unexpected Script Error! Use /bin/sh -x $0 to trace it.
"
set +e

trap "" 0
exit 0
' 0

if [ "$NODEJS_CONFIG" ]
then
    : <<'__' # parse JS content to see database name, i.e.:
var DB = 'MAIN'// name is used in mongo-shell, mongo-export tools
          ^^^^
__
    DB=${NODEJS_CONFIG##*var DB = [\'\"]}
    DB=${DB%%[\'\"]*}
    : <<'__' # parse JS content to see database port, i.e.:
        supromongod:{
            db_path: '/data/supromongod/' + DB + '_wiredTiger/',
            port: 27081,
                  ^^^^^
            db_name: DB
        },
__
    PORT=`sed "/supromongod:{/,/}/{/ port *:/s_.*: *\([[:digit:]]*\).*_\1_p};d" <<EOF
$NODEJS_CONFIG
EOF
`
else
    DB=$1
fi

[ "$PORT" ] || PORT=27727

[ "$DB" ] || echo '
WARNING: $DB is empty
please specify $NODEJS_CONFIG or $2 as DB name
'

case "$OSTYPE" in
*cygwin* | *msys*) # MS Windows
    BIN="${0%/*}/../bin/mongo.exe"
;;
*linux-gnu* | *linux_gnu* | *)
    BIN="${0%/*}/../bin/mongo"
;;
esac

"$BIN" "127.0.0.1:$PORT/$DB"

trap '' 0
exit 0
