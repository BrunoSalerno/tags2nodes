exports.Osm=function(osmread, FILE_PATH, Q,_){
	var self=this;
	
	function print_data() {
		//process.stdout.write("nodes: " + nodes + " ways: " + ways + " relations: " + relations+"\r");
		// commented because is too slow.
	}
	
	this.parse = function(tag_conditions,element,callback){
		// element can be 'node', 'way', 'relation' or 'match_ref'
		
		var nodes=0, ways=0, relations = 0;
		var output=[];
			
		osmread.parse({
			filePath: FILE_PATH,
			endDocument: function(){
				if (typeof callback === 'function') callback(output);
			},
			bounds: function(bounds){
			},
			node: function(node){
				nodes++; 
				print_data();
				if (element='node'){
					for (condition in tag_conditions) {
							if (condition=='match_ref'){
								tag_conditions[condition].forEach(function(id){
										if (node.id==id) output.push(node);
								});
							} else if (node.tags[condition] && node.tags[condition] == tag_conditions[condition]) {
								var is_present=false;
                output.every(function(e){
                  if (e.id==node.id) {
                    is_present=true;
                  }
                  return !is_present
                });
                if (!is_present) output.push(node)
							}
					}
				}
			},
			way: function(way){
				ways++;
				print_data();
				if (element='way'){
					for (condition in tag_conditions) {
							if (way.tags[condition] && way.tags[condition] == tag_conditions[condition]) {
								output.push(way)
							}
					}
				}
			},
			relation: function(relation){
				relations++;
				print_data();
				if (element='relation'){
					for (condition in tag_conditions) {
							if (relation.tags[condition] && relation.tags[condition] == tag_conditions[condition]) {
								output.push(relation)
							}
					}
				}		
			},
			error: function(msg){
					console.log('Error: ' + msg);
			}
		});
	};

	this.fetch_and_save_nodes = function(table,db, nodes, tags_type, extra_condition,callback) {
		db.create_table(table, tags_type, function(){
			var nodes_to_fetch=[];
			
			for (n in nodes){
				nodes_to_fetch.push(nodes[n].member.ref)
			}

      var conditions=_.extend({match_ref:nodes_to_fetch},extra_condition);

			self.parse(conditions,'node',function(fetched_nodes){
				row_insertions=[];
					
				fetched_nodes.forEach(function(node){
          // Required by nodes fetched by extra_condition
					if (!nodes[node.id]) {
            nodes[node.id]={relations:[]}
          }
          //nodes[node.id].node=node; // Useless assignation
					nodes[node.id].relations.forEach(function(r){
						node.tags["relations"]={};
						for (t in r.tags) {
							if (!node.tags["relations"][r.id]) node.tags["relations"][r.id]={};
							node.tags["relations"][r.id][t]=r.tags[t];
						}
					});
					
					var row_promise=new Q.defer();
					row_insertions.push(row_promise);
						
					db.add_row(table,node.id,node.tags,node.lat,node.lon, function(){
						row_promise.resolve();
					});
				});
				
				Q.allSettled(row_insertions).then(function() {
					if (typeof callback === 'function') callback(row_insertions.length);
				});
			});
			
		});
	}
};




