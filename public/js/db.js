app.service('dbService', [function() {
    // db setup
    var dbName = 'soundboard';
    var dbUrl  = 'http://couch.curtish.me/';
    var db;
    
    var handleSuccess = function() {
        return true;
    };
    
    this.connect = function() {
        db = new PouchDB(dbName);
    
        // define sync
        return db.sync(dbUrl+dbName, {live: true})
        
        console.log('db connected');
        return db;
    };
    
    this.get = function(id) {
        return db.get(id).then(function(doc) {
            return doc;
        })
        .catch(function(error) {
            console.log('fetch error');
            console.log(error);
        });
    };
    
    this.getCategories = function() {
        return db.allDocs({
            include_docs: true,
            startkey:     'category',
            endkey:       'category\uffff'
        })
        .then(function(results) {
            return results.rows.map(function(row) {
                return row.doc;
            });
        })
        .catch(function(err) {
            console.log('error', error);
            return [];
        });
    };
    
    
    this.getSounds = function(categoryId) {
        return db.allDocs({
            include_docs: true,
            startkey:     'sound',
            endkey:       'sound\uffff'
        })
        .then(function(results) {
            return results.rows.filter(function(row) {
                return row.doc.category == categoryId;
            })
            .map(function(row) {
                return row.doc;
            });
        })
        .catch(function(err) {
            return [];
        });
    };
    
    /**
     * create a new document var for saving
     * @param params - specific data to put in base document model
     */
    this.document = function(params) {
        var type = !!params.type ? params.type : 'null';
        var id   = type + (new Date().toJSON());
        var doc  = angular.extend({
            '_id': id,
            'uid': UID,
            'type': ''
        }, params);
        
        return doc;
    };
    
    /**
     * create a new category document
     * TODO - create notifications helper for success and failure messages
     */
    this.newCategory = function(name) {
        var cat = this.document({
            'type': 'category',
            'name': name
        });
        
        return db.put(cat)
        .then(function(res) {
            console.log(res);
            return true;
        })
        .catch(function(err) {
            console.log('error', err);
            return false;
        });
    };
    
    this.newSound = function(catId, params, ident) {
        var sound = this.document(angular.extend({
            'type':     'sound',
            'category': catId,
            'ident':    ident
        }, params));
        
        console.log(sound);
        
        return db.put(sound)
        .then(function(res) {
            return true;
        })
        .catch(function(err){
            return false;
        });
    };
    
    // TODO - make this a more generic update function
    this.updateSound = function(sound) {
        return db.put(sound)
        .then(function(result) {
            console.log('put sound');
            console.log(result);
            return true;
            if(!!result && result.ok) {
                return result.rev
            }
            return false;
        })
        .catch(function(error) {
            return false;
        });
    };
}]);