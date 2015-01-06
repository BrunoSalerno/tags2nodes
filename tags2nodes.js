#!/usr/bin/env node

var osmread=require('osm-read');
var pg = require('pg').native;
var _ = require('underscore');
var Q = require('q');
var argv = require('minimist')(process.argv.slice(2));
var postgres=require('./lib/postgres');
var osm=require('./lib/osm');

if (argv["help"]) {
	console.log(" tags2nodes arguments \n" +
	" -f      input osm.pbf file \n"  +
	" -u      postgres user \n" +
	" -p      postgres password \n" +
	" -h      postgres host \n" +
	" -d      postgres db name \n" +
  " -c      osm relation condition json (without quotes!). I.e.: {route:subway} \n" +
  " -r      [optional] role of members of relation to be filtered. I.e.: stop. Default: all roles \n" +
  " -e      [optional] condition that allows to fetch nodes outside relations. I.e: {station:subway} \n" +
	" -t      [optional] postgres output table name. Default: tags2nodes \n" +
	" -j      [optional] output projection. Default: WGS84 (4326) \n" +
	" --json  [optional] json format for tags field. Only valid for Postgres >= 9.3. Default: text \n" +
	" --jsonb [optional] jsonb format for tags field (faster!). Only valid for Postgres >= 9.4. Default: text \n" +
  " --help  this help");
	return;
}

if (!argv["f"] || !argv["u"] || !argv["p"] || !argv["h"] || !argv["d"] || !argv["c"]) {
	console.log("Arguments missing \n '--help' for help");
	return;
}

var FILE_PATH = argv["f"];

var connection={
			username: argv["u"],
			password: argv["p"],
			host: argv["h"],
			db: argv["d"]
	};

var table = argv["t"] || "tags2nodes";
var proj = (argv["j"])? parseInt(argv["j"]) : 4326;	

var connection_string = "postgres://"+
                         connection.username+":"+
                         connection.password+"@"+
                         connection.host+"/"+
                         connection.db;

var db= new postgres.Query;

osm = new osm.Osm(osmread,FILE_PATH, Q, _);

var relation_conditions={};
var relation_conditions_members=argv["c"].substring(1, argv["c"].length-1).split(":");
relation_conditions[relation_conditions_members[0]]=relation_conditions_members[1];

var extra_condition={};
if (argv["e"]) {
  var extra_condition_members = argv["e"].substring(1, argv["e"].length - 1).split(":");
  extra_condition[extra_condition_members[0]] = extra_condition_members[1];
}

var role = argv["r"];

var tags_type='text'; 
if (argv["json"]) tags_type='json';
if (argv["jsonb"]) tags_type='jsonb';

console.log('Fetching relations...');
	
osm.parse(relation_conditions,'relation', function(relations){				
	var nodes={};
	relations.forEach (function(relation){
		relation.members.forEach(function(member){

			if (((role && member.role==role) || !role) && member.type == 'node'){
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
		osm.fetch_and_save_nodes(table,db,nodes,tags_type,extra_condition, function(number_rows_inserted){
			console.log(number_rows_inserted + " nodes inserted into " + table + ".");
			done();
		});
	});
	
});



