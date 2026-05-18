const {pool} = require('../../config/db');

exports.createFaqs = async (data) => {
  const query = `
    INSERT INTO pregunta (
      pregunta,
      respuesta
    ) VALUES (?, ?)
  `;

  const values = [
    data.pregunta,
    data.respuesta
  ];
  
  const [result] = await pool.query(query, values);

  return {
    id_pregunta: result.insertId,
    ...data
  };
};

exports.getFaqs = async () => {
  const query = `
    SELECT
      id_pregunta,
      pregunta,
      respuesta
    FROM pregunta
  `;

  const [rows] = await pool.query(query);
  return rows;
};

exports.getFaqsById = async (id) => {
  const [rows] = await pool.query(
    'SELECT * FROM pregunta WHERE id_pregunta = ?',
    [id]
  );

  return rows[0];
};

exports.updateFaqs = async (id, data) => {
  const query = `
    UPDATE pregunta
    SET
      pregunta=?,
      respuesta=?
    WHERE id_pregunta=?
  `;

  const values = [
    data.pregunta,
    data.respuesta,
    id 
  ];

  const [result] = await pool.query(query, values);
  return result.affectedRows > 0;
};

exports.deleteFaqs = async (id) => {
  const [result] = await pool.query(
    'DELETE FROM pregunta WHERE id_pregunta = ?',
    [id]
  );

  return result.affectedRows > 0;
};