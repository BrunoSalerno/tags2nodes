tags2nodes
==========

An OSM tool for attaching relation tags to the member nodes

Options
-------

```
 -f      input osm.pbf file
 -u      postgres user
 -p      postgres password
 -h      postgres host
 -d      postgres db name
 -c      osm relation condition json. I.e.: {'route':'subway'}'
 -r      role of members of relation to be filtered. I.e.: stop
 -t      [optional] postgres output table name. Default: tags2nodes
 -j      [optional] output projection. Default: WGS84 (4326)
 --json  [optional] json tags field postgres format. Only valid for Postgres >= 9.3. Default: text
 --jsonb [optional] jsonb tags field postgres format (faster!). Only valid for Postgres >= 9.4. Default: text
 ```
	
License
-------

MIT.
