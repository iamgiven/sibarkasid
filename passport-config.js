const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')

function initialize(passport, getUserByEmail, getUserById) {
    const authenticateUser = async (email, password, done) => {
        const user = await getUserByEmail(email);
        if (!user) {
          return done(null, false, { message: 'Tidak ada user dengan email itu' });
        }
      
        try {
          if (!password) {
            return done(null, false, { message: 'Password tidak boleh kosong' });
          }
      
          if (await bcrypt.compare(password, user.password)) {
            return done(null, user);
          } else {
            return done(null, false, { message: 'Password yang anda masukkan salah!' });
          }
        } catch (error) {
          return done(error);
        }
      };
  
    passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser));
  
    passport.serializeUser(function(user, done) {
        done(null, user);
      });
      
    passport.deserializeUser(function(user, done) {
        done(null, user);
    });
      
  }
  
  module.exports = initialize;
  