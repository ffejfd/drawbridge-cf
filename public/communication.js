var CommLink = {
    socket : null, // io.setPath must be called before socket creation for flashsockets

    establish : function(){
        io.setPath("/socket.io/");
		this.socket = new io.Socket(null, {port : window.location.port || 80,
		                                   rememberTransport : false,
										   // flash sockets disabled
										   transports : ['websocket', 'server-events',
														 'htmlfile', 'xhr-multipart',
														 'xhr-polling']});
        this.socket.connect();

        this.socket.on('message', function(msg){
            msg = JSON.parse(msg);
            console.log(msg);
	        if(msg.action == 'add_segment'){
	            if(typeof(msg.segment.points) == 'string')
	                msg.segment.points = JSON.parse(msg.segment.points);
	            UI.sketchCanvas(msg.sketch_revision_id).addSegment(msg.segment);
                draw_history.addUndoTask({action: "segment_added", 
										  segment: msg.segment, 
										  sketch_revision_id: getRevisionId()});


	            if(getRevisionId() == msg.sketch_revision_id){
                    var lil = UI.variations[getRevisionId()];
                    lil.context.drawImage(UI.canvas.canvas, 0, 0, lil.width, lil.height);
                }
	        }else if(msg.action == 'delete_segment'){
                seg = UI.canvas.deleteSegment(msg.segment_id);
                console.log(seg);
                var lil = UI.variations[getRevisionId()];
                lil.context.drawImage(UI.canvas.canvas, 0, 0, lil.width, lil.height);
            }else if(msg.action == 'add_user'){
                UI.sign_on_user(msg);
            }else if(msg.action == 'sign_off_user'){
                UI.sign_off_user(msg);
            }else if(msg.action == 'share_key'){
                UI.updateSharedKey(msg.key);
            }else if(msg.action == 'add_variation'){
				UI.add_variation(msg);
			}
        });
    },
    
    saveImage : function(){
        this.send({
           action: 'save_sketch',
           payload: UI.canvas.canvas.toDataURL() 
        });
    },
    
    reportSegmentDeleted : function(seg, sketchId){
		draw_history.addUndoTask({action: "segment_deleted", segment: seg, sketch_base_id: getBaseId(), sketch_revision_id: getRevisionId()});
        this.send({action             : 'segment_deleted',
                   segment_id         : seg.id,
                   sketch_base_id     : getBaseId(),
                   sketch_revision_id : sketchId});
    },
    
    reportSegmentDrawn : function(seg, sketchId){
        this.send({action             : 'segment_added',
                   segment            : seg,
                   sketch_base_id     : getBaseId(),
                   sketch_revision_id : sketchId});
    },
    
    reportSignOn : function(uname){
        this.send({action            : 'user_added',
                  name               : uname,
                  sketch_base_id     : getBaseId(),
                  sketch_revision_id : getRevisionId()});
    },

	requestNewVariation : function(){
		this.send({action			: 'variation_added',
				   sketch_parent_id	: getRevisionId(),
				   sketch_base_id	: getBaseId()});
	},

    send : function(data){
        this.socket.send(JSON.stringify(data));
    }

};
CommLink.establish();
