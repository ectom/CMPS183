# Here go your api methods.


@auth.requires_signature()
def add_post():
    post_id = db.post.insert(
        post_title=request.vars.post_title,
        post_content=request.vars.post_content,
    )
    # We return the id of the new post, so we can insert it along all the others.
    return response.json(dict(post_id=post_id))


def get_post_list():
    results = []
    if auth.user is None:
        # Not logged in.
        rows = db().select(db.post.ALL, orderby=~db.post.post_time)
        for row in rows:
            results.append(dict(
                id=row.id,
                post_title=row.post_title,
                post_content=row.post_content,
                post_author=row.post_author,
                thumb = None
            ))
    else:
        # Logged in.
        rows = db().select(db.post.ALL, db.thumb.ALL,
                            left=[
                                db.thumb.on((db.thumb.post_id == db.post.id) & (db.thumb.user_email == auth.user.email)),
                            ],
                            orderby=~db.post.post_time)
        for row in rows:
            results.append(dict(
                id=row.post.id,
                post_title=row.post.post_title,
                post_content=row.post.post_content,
                post_author=row.post.post_author,
                thumb = None if row.thumb.id is None else row.thumb.thumb_state,
            ))
    # For homogeneity, we always return a dictionary.
    return response.json(dict(post_list=results))

@auth.requires_signature()
def set_thumb():
    post_id = int(request.vars.post_id)
    thumb_state = request.vars.thumb
    db.thumb.update_or_insert(
        (db.thumb.post_id == post_id) & (db.thumb.user_email == auth.user.email),
        post_id = post_id,
        user_email = auth.user.email,
        thumb_state = thumb_state
    )

def get_thumbs():
    likes = len(db((db.thumb.post_id == request.vars.post_id) & (db.thumb.thumb_state == 'u')).select())
    dislikes = len(db((db.thumb.post_id == request.vars.post_id) & (db.thumb.thumb_state == 'd')).select())
    total = likes-dislikes
    return response.json(dict(total=total))
    # """Gets the list of people who liked a post."""
    # # We get directly the list of all the users who liked the post.
    # rows = db().select(db.thumb.ALL)
    # # If the user is logged in, we remove the user from the set.
    # thumbs_set = set([r for r in rows])
    # thumbs_list = list(thumbs_set)
    # thumbs_list.sort()
    # # # We return this list as a dictionary field, to be consistent with all other calls.
    # return response.json(dict(thumbs=thumbs_list))

@auth.requires_signature()
def edit_post():
    id = int(request.vars.id)
    title = request.vars.post_title
    content = request.vars.post_content
    print id
    db((db.post.id == id) & (db.post.post_author == auth.user.email)).update(
        post_title = title,
        post_conent = content
    )
    # row.post_title = title
    # row.update_record()
    # row.post_conent = content
    # row.update_record()
    # We return the id of the new post, so we can insert it along all the others.
    # return response.json(dict(row=row))
    return "ok"

def editable():
    author = request.vars.author
    if author == auth.user.email:
        return True
    else:
        return False

@auth.requires_signature()
def set_reply():
    id = request.vars.id
    reply = request.vars.reply
    print id
    # _or_insert
    reply_id = db.reply.update_or_insert(
        (reply != ""),
        post_id = id,
        reply_content = reply
    )
    return response.json(dict(reply_id=reply_id))
