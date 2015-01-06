exports.Query = function(){
	var self=this;
	this.client=null;
	this.proj=4326; //default proj = 4326, WGS84
	
	this.set_client=function(client,proj){
		self.client=client;
		self.proj=proj || this.proj;
	};
	
	this.create_table = function(table, tags_type, callback){		
		self.client.query('DROP TABLE IF EXISTS '+table, function(err,result){
		
			self.client.query('CREATE TABLE '+
                        table +
                        '(id bigint primary key, tags ' +
                        tags_type +
                        ',lat float8, lon float8)', function(err,result){

				if(err) return console.error('Error running query', err);
							
				self.client.query("SELECT AddGeometryColumn('"+table+"', 'geo',"+self.proj+" , 'POINT', 2 );",
          function(err,result){
						if(err) return console.error('Error running query', err);
						if (typeof callback === 'function') callback();
				});
			});
			
		});
	};

	this.add_row = function(table, id, tags, lat, lon, callback){		
		var geo='ST_SetSRID(ST_MakePoint('+lon+','+lat+'), '+self.proj+')';
		
		self.client.query("INSERT INTO "+
                      table +
                      " VALUES ("+
                      id+",'"+
                      clean_str(tags)+"',"+
                      lat+","+lon+","+geo+")", function(err,result){

			if(err) return console.error('Error running query', err);
			if (typeof callback === 'function') callback();
		});
	};

  function clean_str(str) {
    var stringified=JSON.stringify(str);
    return stringified.replace("'"," ")
  }
};

