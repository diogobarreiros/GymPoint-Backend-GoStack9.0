import * as Yup from 'yup';
import { Op } from 'sequelize';
import Student from '../models/Student';

class StudentController {
  async index(req, res) {
    const { page = 1 } = req.query;
    const { pageLimit = 20 } = req.query;
    const { q: studentName } = req.query;

    const response = studentName
      ? await Student.findAll({
          limit: pageLimit,
          offset: (page - 1) * pageLimit,
          where: {
            name: {
              [Op.like]: `%${studentName}%`,
            },
          },
        })
      : await Student.findAll({
          limit: pageLimit,
          offset: (page - 1) * pageLimit,
        });

    response.sort((a, b) => a.name.localeCompare(b.name));

    res.json(response);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string()
        .email()
        .required(),
      age: Yup.number()
        .integer()
        .required()
        .min(2),
      height: Yup.number(),
      weight: Yup.number(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const studentExists = await Student.findOne({
      where: { email: req.body.email },
    });

    if (studentExists) {
      return res.status(400).json({ error: 'Student already exists.' });
    }

    const student = await Student.create(req.body);

    return res.json(student);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      id: Yup.number()
        .integer()
        .required(),
      name: Yup.string(),
      email: Yup.string().email(),
      oldPassword: Yup.string().min(6),
      age: Yup.number()
        .integer()
        .min(2),
      height: Yup.number(),
      weight: Yup.number(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const student = await Student.findOne({ where: { id: req.body.id } });

    if (!student) {
      return res.status(400).json({ error: 'Student does not exists' });
    }

    const email = req.body.email != null ? req.body.email : student.email;

    if (email !== student.email) {
      const studentExists = await Student.findOne({ where: { email } });

      if (studentExists) {
        return res.status(400).json({ error: 'Student already exists.' });
      }
    }

    const studentUpdate = await student.update(req.body);

    return res.json(studentUpdate);
  }
}

export default new StudentController();
