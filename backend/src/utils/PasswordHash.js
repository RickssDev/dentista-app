const bcrypt = require('bcrypt');

class PasswordHash {
	static async apply(password, saltRounds = 10) {
		return bcrypt.hash(password, saltRounds);
	}

	static async verify(passwordPlano, passwordHasheado) {
		return bcrypt.compare(passwordPlano, passwordHasheado);
	}
}

module.exports = PasswordHash;
