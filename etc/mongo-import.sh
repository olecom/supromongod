#!/bin/sh
# Export a collection using `mongoexport` and current config $DB
# NOTE: "host" is hardcoded to '127.0.0.1',
#       "port" is 27727 or $NODEJS_CONFIG.supromongod.port
# $1 -- collection name
# DB name is taken from $NODEJS_CONFIG or $2
# input is from: $2 if no $DB there or $3 or STDIN otherwise
set -e

trap 'echo "
Unexpected Script Error! Use /bin/sh -x $0 to trace it.
"
set +e

trap "" 0
exit 0
' 0

[ "$1" ] || {
    echo '
No collection name in "$1"
'
    trap '' 0
    exit 1
}

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
    FILE=$2
else
    DB=$2
    FILE=$3
fi

[ "$PORT" ] || PORT=27727

[ "$DB" ] || echo '
WARNING: $DB is empty
please specify $NODEJS_CONFIG or $2 as DB name
'
[ "$FILE" ] && SRC=$FILE || SRC=STDIN

echo "
from '$SRC' importing into '$DB' '$1'
...
"

"${0%/*}/../bin/mongoimport"             \
              '--host' "127.0.0.1:$PORT" \
              '--db' "$DB"               \
              '--collection' "$1"        \
              $FILE

trap '' 0
exit 0
