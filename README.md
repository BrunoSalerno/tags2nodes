tags2nodes
==========

An OSM tool for attaching relation tags to the member nodes.

You have to specify the osm input file, the relation you want to filter, the postgres user and db data and the program creates a table to store the ouput nodes with 3 columns: id, tags, and geometry.

In the column tags (json stringified by default) you can find, besides the node tags, something like this:

```
relations : {relationid1:{name:'relation1 name', id:'relation1 id',...},
            relationid2:{name:'relation2 name', id:'relation2 id',...}}
```

Install
-------

```
sudo npm install -g tags2nodes
```
or git clone this repository.

Usage
-----

```
tags2nodes [arguments]
```

Arguments
-------

```
 -f      input osm.pbf file
 -u      postgres user
 -p      postgres password
 -h      postgres host
 -d      postgres db name
 -c      osm relation condition json (without quotes!). I.e.: {route:subway}
 -r      [optional] role of members of relation to be filtered. I.e.: stop. Default: all roles
 -t      [optional] postgres output table name. Default: tags2nodes
 -j      [optional] output projection. Default: WGS84 (4326)
 --json  [optional] json tags field postgres format. Only valid for Postgres >= 9.3. Default: text
 --jsonb [optional] jsonb tags field postgres format (faster!). Only valid for Postgres >= 9.4. Default: text
 --help  this help
 ```
	
License
-------

MIT.
