console.log("start of commjs");
var CommLink = {
    socket : null, // io.setPath must be called before socket creation for flashsockets

    establish : function(){
        io.setPath("/socket.io/");
		this.socket = new io.Socket(null, {port : window.location.port || 80,
		                                   rememberTransport : false});
        this.socket.connect();

        this.socket.on('message', function(msg){
            msg = JSON.parse(msg);
	        if(msg.action == 'add_segment'){
                UI.canvas.displaySegment(msg.segment);
                UI.canvas.segments.push(seg);
            }else if(msg.action == 'delete_segment'){
                UI.canvas.deleteSegment(msg.segment_id);
            }else if(msg.action == 'add_user'){
                UI.sign_on_user(msg);
            }else if(msg.action == 'sign_off_user'){
                UI.sign_off_user(msg);
            }
        });
    },
    
    reportSegmentDeleted : function(seg_id, sketchId){
        this.send({action             : 'segment_deleted',
                   segment_id         : seg_id,
                   sketch_base_id     : getBaseId(),
                   sketch_revision_id : getRevisionId()});
    },
    
    reportSegmentDrawn : function(seg, sketchId){
        this.send({action             : 'segment_added',
                   segment            : seg,
                   sketch_base_id     : getBaseId(),
                   sketch_revision_id : getRevisionId()});
    },
    
    reportSignOn : function(uname){
        this.send({action            : 'user_added',
                  name               : uname,
                  sketch_base_id     : getBaseId(),
                  sketch_revision_id : getRevisionId()});
    },
    
    send : function(data){
        this.socket.send(JSON.stringify(data));
    }
};
console.log("talk");
CommLink.establish();
console.log("talk more");
