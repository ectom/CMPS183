// This is the js for the default/index.html view.
var app = function() {

    var self = {};
    Vue.config.silent = false; // show all warnings

    // Extends an array
    self.extend = function(a, b) {
        for (var i = 0; i < b.length; i++) {
            a.push(b[i]);
        }
    };

    // Enumerates an array.
    var enumerate = function(v) {
        var k=0;
        return v.map(function(e) {
            e._idx = k++;
        });
    };
    self.add_post = function () {
        // We disable the button, to prevent double submission.
        $.web2py.disableElement($("#add-post"));
        var sent_title = self.vue.form_title; // Makes a copy
        var sent_content = self.vue.form_content; //
        $.post(add_post_url,
            // Data we are sending.
            {
                post_title: self.vue.form_title,
                post_content: self.vue.form_content
            },
            // What do we do when the post succeeds?
            function (data) {
                // Re-enable the button.
                $.web2py.enableElement($("#add-post"));
                // Clears the form.
                self.vue.form_title = "";
                self.vue.form_content = "";
                // Adds the post to the list of posts.
                var new_post = {
                    id: data.post_id,
                    post_title: sent_title,
                    post_content: sent_content
                };
                self.vue.post_list.unshift(new_post);
                // We re-enumerate the array.
                self.process_posts();
            });
        // If you put code here, it is run BEFORE the call comes back.
        hide();
    };

    self.get_thumbs = function(){
        var length = self.vue.post_list.length;
        posts = self.vue.post_list
        for(var i = 0; i < length; i++){
            var p = posts[i];
            console.log(p);
            $.post(get_thumbs_url, { post_id: p.id }, function (data) {
                p._total = data.total;
            });
        }
    };

    self.get_posts = function() {
        $.getJSON(get_post_list_url,
            function(data) {
                // I am assuming here that the server gives me a nice list
                // of posts, all ready for display.
                self.vue.post_list = data.post_list;
                // Post-processing.
                self.process_posts();
                self.get_thumbs();
            }
        );
    };

    self.process_posts = function() {
        // This function is used to post-process posts, after the list has been modified
        // or after we have gotten new posts.
        // We add the _idx attribute to the posts.
        enumerate(self.vue.post_list);
        // We initialize the smile status to match the like.

        self.vue.post_list.map(function (e) {
            Vue.set(e, '_reply_list', []);
            Vue.set(e, '_editing', false); // keeps track of wether or not a post is being edited
            Vue.set(e, '_editable'); // keeps track of who is allowed to edit a post
            Vue.set(e, '_replying', false); // keeps track of wether or not reply form is shown
            Vue.set(e, '_show_replies', false); // keeps track of the show reply button
            Vue.set(e, '_total'); //keeps track of total likes vs dislikes
            Vue.set(e, '_gray_thumb'); //keeps track of when thumbs are supposed to be gray
            Vue.set(e, '_num_thumb_display'); //keeps track of thumbs while hoverings
        });
    };

    self.total = function(p){
        $.post(get_thumbs_url, { post_id: p.id }, function (data) {
            p._total = data.total;
        })
    };

    self.thumbs_up_over = function(post_idx, thumbs_up_idx) {
        var p = self.vue.post_list[post_idx];
        console.log(p, thumbs_up_idx);
        if(p.thumb === 'd'){
            p._gray_thumb = 'u';
        }
        else if(p.thumb === 'u'){
            p._num_thumb_display = 'u';
            p._gray_thumb = 'd';
        }
        else{
            p._gray_thumb = 'u';
        }
    };

    self.thumbs_down_over = function(post_idx, thumbs_down_idx) {
        var p = self.vue.post_list[post_idx];
        if(p.thumb === 'u'){
            p._gray_thumb = 'd';
        }
        else if(p.thumb === 'd'){
            p._num_thumb_display = 'd';
            p._gray_thumb = 'u';
        }
        else{
            p._gray_thumb = 'd';
        }
    };

    self.thumbs_up_out = function(post_idx, thumbs_up_idx) {
        var p = self.vue.post_list[post_idx];
        self.vue.thumbs_up_state = false;
        p._num_thumb_display = p.thumb;
        p._gray_thumb = 'null';
    };

    self.thumbs_down_out = function(post_idx, thumbs_downdown_idx) {
        var p = self.vue.post_list[post_idx];
        self.vue.thumbs_down_state = false;
        p._num_thumb_display = p.thumb;
        p._gray_thumb = null;
    };

    self.show = function(){
        if(self.vue.isHidden){
            self.vue.isHidden = false;
        }
        if (is_logged_in && !self.vue.isHidden) {
            $(".add_posts").show();
            $(".add_post_button").hide();
        }
    };

    function hide(){
        if(!self.vue.isHidden){
            self.vue.isHidden = true;
        }
        if (is_logged_in && self.vue.isHidden) {
            $(".add_posts").hide();
            $(".add_post_button").show();
        }
    };
    // thumb keeps track of the gray thumb
    // vote confirms which thumb has been clicked
    self.set_thumb = function(post_idx, thumb, vote) {
        // The user has set this as the number of stars for the post.
        var p = self.vue.post_list[post_idx];
        if(thumb === 'u' && p._num_thumb_display === 'd' && vote === 'down'){
            p.thumb = null;
            console.log('when black thumbs down clicked');
        }
        else if(thumb === 'd' && p._num_thumb_display === 'u' && vote === 'up'){
            p.thumb = null;
            console.log('when black thumbs up clicked');
        }
        else{
            p.thumb = thumb;
        }
        // Sends the rating to the server.
        $.post(set_thumb_url, {
            post_id: p.id,
            thumb: p.thumb
        }, function(){
            self.total(p);
        });
    };

    self.edit = function(post_id){
        var p = self.vue.post_list[post_id];
        p._editing = true;
        console.log('edit', p._editing);
    }

    self.edited = function(post_id){
        var p = self.vue.post_list[post_id];
        p._editing = false;
        $.post(edit_post_url,
            {
                id: p.id,
                post_title: p.post_title,
                post_content: p.post_content
            },
            function (data) {
                console.log(data);
                // Shows updated post
                // self.vue.post_list[post_id].post_content = data.post_content;
                // We re-enumerate the array.
                // self.process_posts();

            });
    }
    // post_id
    self.editable = function (post_id){
        // for(var idx = 0; idx < self.vue.post_list.length; idx++){
            var post = self.vue.post_list[post_id];
            if(post._editable !== undefined){
                return post._editable;
            }else{
                $.get(editable_url,
                    {
                        author: post.post_author
                    }, function(data) {
                        if(data == 'True'){
                            post._editable = true;
                        } else {
                            post._editable = false;
                        }
                });
                return post._editable;
            }
        // }
        // var post = self.vue.post_list[post_id]

    }

    self.reply = function (post_id) {
        var post = self.vue.post_list[post_id]
        post._replying = true;
    }

    self.set_reply = function (post_id) {
        var id = post_id;
        var post = self.vue.post_list[post_id];
        var sent_content = self.vue.reply_content; // Makes a copy
        post._replying = false;

        $.post(set_reply_url,
        {
            id: post.id,
            reply: self.vue.reply_content
        }, function (data) {
            // Clears the form.
            self.vue.reply_content = "";
            console.log(data.reply[0]);
            // Adds the post to the list of posts.
            var new_reply = {
                id: data.reply[0].id,
                reply_author: data.reply[0].reply_author,
                reply_content: sent_content,
                reply_time: data.reply[0].reply_time
            };
            post._reply_list.push(new_reply);
            // We re-enumerate the array.
            self.process_replies(post_id);
        });

    }

    self.process_replies = function(post_id) {
        // We add the _idx attribute to the posts.
        var post = self.vue.post_list[post_id];
        enumerate(post._reply_list);
    };

    self.show_replies = function(post_id){
        var post = self.vue.post_list[post_id];
        post._show_replies = true;
        $.get(get_replies_url,
            {
                post_id: post.id
            },
            function(data){
                post._reply_list = data.replies;
            }

        )
    }
    // Complete as needed.
    self.vue = new Vue({
        el: "#vuediv",
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
            form_title: "",
            form_content: "",
            post_list: [],
            thumbs_list: [],
            isHidden: true,
            reply_content: ""
        },
        methods: {
            add_post: self.add_post,
            editable: self.editable,
            show: self.show,
            edit: self.edit,
            edited: self.edited,
            thumbs_up_over: self.thumbs_up_over,
            thumbs_down_over: self.thumbs_down_over,
            thumbs_up_out: self.thumbs_up_out,
            thumbs_down_out: self.thumbs_down_out,
            set_thumb: self.set_thumb,
            reply: self.reply,
            set_reply: self.set_reply,
            show_replies: self.show_replies
        }

    });

    // Gets the posts.
    self.get_posts();

    return self;
};

var APP = null;

// No, this would evaluate it too soon.
// var APP = app();

// This will make everything accessible from the js console;
// for instance, self.x above would be accessible as APP.x
jQuery(function(){APP = app();});
