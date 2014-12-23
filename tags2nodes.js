#!/usr/bin/env node

var osmread=require('osm-read');
var pg = require('pg').native;
var Q = require('q');
var argv = require('minimist')(process.argv.slice(2));
var postgres=require('./lib/postgres');
var osm=require('./lib/osm');

if (argv["help"]) {
	console.log(" tags2nodes arguments ");
	console.log(" -f      input osm.pbf file");
	console.log(" -u      postgres user");
	console.log(" -p      postgres password");
	console.log(" -h      postgres host");
	console.log(" -d      postgres db name");
  console.log(" -c      osm relation condition json (without quotes!). I.e.: {route:subway}");
  console.log(" -r      [optional] role of members of relation to be filtered. I.e.: stop. Default: all roles");
	console.log(" -t      [optional] postgres output table name. Default: tags2nodes");
	console.log(" -j      [optional] output projection. Default: WGS84 (4326)");
	console.log(" --json  [optional] json tags field postgres format. Only valid for Postgres >= 9.3. Default: text");
	console.log(" --jsonb [optional] jsonb tags field postgres format (faster!). Only valid for Postgres >= 9.4. Default: text");
  console.log(" --help  this help");
	return;
};

if (!argv["f"] || !argv["u"] || !argv["p"] || !argv["h"] || !argv["d"] || !argv["c"]) {
	console.log("Arguments missing");
	return;
};

var FILE_PATH = argv["f"];

var connection={
			username: argv["u"],
			password: argv["p"],
			host: argv["h"],
			db: argv["d"]
	}

var table = argv["t"] || "tags2nodes";
var proj = (argv["j"])? parseInt(argv["j"]) : 4326;	

var connection_string = "postgres://"+connection.username+":"+connection.password+"@"+connection.host+"/"+connection.db;

var db= new postgres.Query;

osm = new osm.Osm(osmread,FILE_PATH, Q);

var json_members=argv["c"].substring(1, argv["c"].length-1).split(":");
var json={};
json[json_members[0]]=json_members[1];

var relation_conditions = json;
var role = argv["r"];

var tags_type='text'; 
if (argv["json"]) tags_type='json';
if (argv["jsonb"]) tags_type='jsonb';

console.log('Fetching relations...');
	
osm.parse(relation_conditions,'relation', function(relations){				
	var nodes={};
	relations.forEach (function(relation){
		relation.members.forEach(function(member){
			if ((role && member.role==role) || !role){
					if (!nodes[member.ref]){
						nodes[member.ref]={member:member,relations:[]}						
					}
					nodes[member.ref].relations.push(relation);
			}
		});
	});
	console.log("Fetching and saving nodes...");
	
	pg.connect(connection_string, function(err, client, done) {
		
		if (err) {
			return console.error('Error fetching client from pool', err);
		}
  
		db.set_client(client,proj);
		osm.fetch_and_save_nodes(table,db,nodes,tags_type, function(number_rows_inserted){
			console.log(number_rows_inserted + " nodes inserted into " + table + ".");
			done();
		});
	});
	
});



