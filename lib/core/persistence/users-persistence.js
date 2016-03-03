'use strict';

var async   = require('async');
var logger  = LOGGER.getLogger('UsersPersistence');
var uuid = require('uuid');

class UsersPersistence{

    constructor(persistence){
        this.persistence = persistence;
        this.db = this.persistence.createDataStore('users.db');
    }

    initialize(cb){

        var self = this;
        async.series([

            self.db.loadDatabase.bind(self.db),

        ], function(err){
            if(!err){
                logger.debug('Initialized');
            }
            return cb(err);
        });
    }

    /**
     *
     */
    loadOrCreate(cb){
        var self = this;
        var query = {

        };

        this.persistence.find(this.db, query, function(err, row){
            if(err) return cb(err);

            if(row){
                return cb(null, row);
            }

            logger.info('No user found yet. Creating...');
            self.persistence.createOrUpdate(self.db, self._getDefaultUserData(), {}, function(err, row, inserted){
                if(err) return cb(err);

                return cb(null, inserted);
            });
        });
    }

    save(id, user, cb){

        var query = {
            _id: id,
        };

        this.persistence.saveOrUpdate(this.db, user, query, cb);
    }

    _getDefaultUserData(){
        return {
            credentials: {
                google: {

                }
            },
            config: {

                // Used to store external services credentials
                externalServices: {
                    google: {
                        auth: {
                            clientId: null,
                            clientSecret: null
                        }
                    }
                },

                screens: [
                    // default screen
                    {
                        id: uuid.v1(),
                        name: 'Default',
                        description: 'This is your first screen'
                    }
                ]
            }
        }
    }
}

module.exports = UsersPersistence;