//require.paths.push('/home/ubuntu/.node_libraries');
VCAP_APP_PORT = Number(process.env.VCAP_APP_PORT) || 80;
//VCAP_APP_PORT = '80';
require.paths.push('./node_modules');
var sys = require('sys'),
    exec = require('child_process').exec,
    express = require('express'), 
    server = express.createServer(express.logger()),
    appops = require('./appops.js'),
    io = require('socket.io');

server.configure(function(){
	server.use(server.router);
	server.use(express.staticProvider(__dirname+'/public'));
});

/* errors! */
	function NotFound(msg){
		this.name = 'NotFound';
		Error.call(this, msg);
		Error.captureStackTrace(this, arguments.callee);
	}

	sys.inherits(NotFound, Error);

	server.get('/404', function(req, res){
		throw new NotFound;
	});

	server.get('/500', function(req, res){
		throw new Error('Server error!');
	});

	server.error(function (err, req, res, next){
		if (err instanceof NotFound){
			res.redirect("/view/404")
		}else {
			next(err);
		}
	});


/* starts the server */
port = parseInt(VCAP_APP_PORT);
console.log("Trying to listen on port", port);
server.listen(port);
console.log("Listening on port", port);
appops.setupdb();
console.log("Loaded db schema", port);

/* websocket stuff */
var sketches = {}, clients = {};

function eachInSketch(sketchBaseId, callback){
    if(sketches[sketchBaseId] == undefined)
        sketches[sketchBaseId] = [];
    for(var x in sketches[sketchBaseId]){
        callback(sketches[sketchBaseId][x]);
    }
}

function removeFromSketch(sessionId){
    if(clients[sessionId] != undefined){
        var arr = sketches[clients[sessionId]] || [];
        delete clients[sessionId];
        
        for(var x in arr){
            if(arr[x].sessionId == sessionId){
                return arr.splice(x, 1);
            }
        }
    }
}

//Setup Socket.IO
var io = io.listen(server, { transports: ['xhr-polling'], 
                             transportOptions : {'xhr-polling' : { duration : 10000 } }  }
                  );
io.on('connection', function(client){    

	client.on('message', function(message){
	    message = JSON.parse(message);
	    
	    var isNew = clients[client.sessionId] == undefined;
	    
	    if(isNew){
	        appops.eachLeaf(message.sketch_base_id, function(leaf){
	            appops.eachSegmentId(leaf, function(sid){
	                appops.getPointsInSegment({segment_id:sid}, function(seg){
	                    client.send(JSON.stringify({
	                        segment: seg,
	                        action: 'add_segment',
	                        sketch_revision_id: leaf.hash
	                    }));
                    });
	            });
	        });
	    }

		switch(message['action']){
		    case "save_sketch":
		        appops.saveImage(message.payload, function(k){
		            client.send(JSON.stringify({action: "share_key", key: k}));
		        });
		        break;
		        
			case "user_added":
			    if(sketches[message.sketch_base_id] == undefined)
			        sketches[message.sketch_base_id] = [];
			        
			    var c = sketches[message.sketch_base_id];
			        
			    client.username = message.name;
			    
			    removeFromSketch(client.sessionId);
			    clients[client.sessionId] = message.sketch_base_id;
		
			    c.push(client);	    
			    			    			    
			    for(x in c){
			        c[x].send(JSON.stringify({action: "add_user",
			                                  name  : client.username,
			                                  id    : appops.sha1(client.sessionId),
			                                  me    : c[x].sessionId == client.sessionId }));
			        
			        if(isNew && x != c.length-1){
			            client.send(JSON.stringify({
			                action  : "add_user",
			                name    : c[x].username,
			                id      : appops.sha1(c[x].sessionId)
			            }));
			        }
			    }

				break;
			case "segment_added":
				var segment = message.segment;
				var sketch = {base_id: message.sketch_base_id, revision_id: message.sketch_revision_id};
				console.log ("segment added ");
				if (segment.id) {
					
					appops.undeleteSegment(sketch.revision_id, segment, function(segmentObj) {
						c = sketches[message.sketch_base_id];
						for (x  in c ){
							c[x].send(JSON.stringify({
								action: "add_segment", 
								segment: segmentObj,
								sketch_revision_id: message.sketch_revision_id
							}));
						}

					});
				}else {
					appops.addSegment(sketch, segment, function(segmentObj) {
						c = sketches[message.sketch_base_id];
						for (x  in c ){
							c[x].send(JSON.stringify({
								action: "add_segment", 
								segment: segmentObj,
								sketch_revision_id: message.sketch_revision_id
							}));
						}
					});
				}
				break;
			case "segment_deleted":
			    appops.deleteSegment(message.sketch_revision_id, message.segment_id);
			    eachInSketch(message.sketch_base_id, function(cli){
			        cli.send(JSON.stringify({action:'delete_segment',
			                                 sketch_revision_id:message.sketch_revision_id,
			                                 sketch_base_id:message.sketch_base_id,
			                                 segment_id:message.segment_id}));
			    });
			    break;
			case "get_segment":
				var seg = {segment_id: message.segment_id};
				appops.getPointsInSegment(seg, function(segmentObj){
					client.send(JSON.stringify({action: "add_segment", segment : segmentObj}));
				});
				break;
			case "variation_added":
			    appops.createVariation(message.sketch_parent_id, function(leaf){
			        eachInSketch(clients[client.sessionId], function(cli){
			            cli.send(JSON.stringify({
			                action: 'add_variation',
			                sketch_parent_id: message.sketch_parent_id,
			                sketch_base_id: message.sketch_base_id,
			                real_id: leaf.id,
			                sketch_revision_id: leaf.hash
			            }));
			        });
			        appops.eachSegmentId(leaf, function(sid){
    	                appops.getPointsInSegment({segment_id:sid}, function(seg){
    	                    eachInSketch(clients[client.sessionId], function(cli){
    	                        cli.send(JSON.stringify({
        	                        segment: seg,
        	                        action: 'add_segment',
        	                        sketch_revision_id: leaf.hash,
        	                        sketch_real_id: leaf.id
        	                    }));
    	                    });
                        });
    	            });
			    });
			    break;
			case "variation_merged":
			    appops.mergeVariation(message.bottom_revision_id,message.top_revision_id, function(leaf){
			        eachInSketch(clients[client.sessionId], function(cli){
			            cli.send(JSON.stringify({
			                action: 'add_variation',
			                sketch_parent_id: message.sketch_parent_id,
			                sketch_base_id: message.sketch_base_id,
			                real_id: leaf.id,
			                sketch_revision_id: leaf.hash
			            }));
			        });
			        appops.eachSegmentId(leaf, function(sid){
    	                appops.getPointsInSegment({segment_id:sid}, function(seg){
    	                    eachInSketch(clients[client.sessionId], function(cli){
    	                        cli.send(JSON.stringify({
        	                        segment: seg,
        	                        action: 'add_segment',
        	                        sketch_revision_id: leaf.hash,
        	                        sketch_real_id: leaf.id
        	                    }));
    	                    });
                        });
    	            });
			    });
			    break;
			case "sketch_replay_requested":
				console.log("\n\nreplaying: " + message.sketch_revision_id);
				appops.getSketchFromHash(message.sketch_revision_id,function(sketch) {
					appops.getFullSketch(sketch.id, function(segmentObj){
						console.log("inner replay: ");
						console.log(segmentObj);
						segmentObj.forEach(function(segment) {
							client.send(JSON.stringify({
								action: "add_segment", 
								segment: segment,
								sketch_revision_id: message.sketch_revision_id
							}));
						});
					});
				});
				break;
			default:
				console.log(message);
				
		}
	});
	
	client.on('disconnect', function(){
	    eachInSketch(clients[client.sessionId], function(cli){
	        cli.send(JSON.stringify({action:"sign_off_user", id:appops.sha1(client.sessionId)}));
	    });
	    removeFromSketch(client.sessionId);
	});
});


// Routes //

server.get('/setup', function(req,res) {
	appops.setupdb();
});

server.get('/', function(req,res) {
	res.sendfile(__dirname+'/public/index.html');
});

server.get('/sketch/:hash?', function(req,res){
	if(req.params.hash){
		    if (req.params.hash != "public" && req.params.hash.length != 40){
				res.redirect("/view/404");
			}else {

				res.sendfile(__dirname+'/public/drawing.html');
			}
	}else{
		appops.addSketch(function(hsh) {
			res.redirect('/sketch/'+hsh, 302);
		});
	}
});

server.get('/view/:hash?', function (req, res) {
	if(req.params.hash){
		if (req.params.hash != "404" && req.params.hash.length != 40){
				res.redirect("/view/404");
		}

			res.sendfile(__dirname+'/public/view.html');
	} else {
		res.redirect('/sketch',302);
	}
});

server.get("/rendered/:key", function(req, res){
    appops.getImage(req.params.key, function(data){
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end(data);
    });
});

/*server.get("/:x", function(req, res){
    res.redirect('/404');
});*/

