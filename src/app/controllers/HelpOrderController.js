import * as Yup from 'yup';
import HelpOrder from '../models/HelpOrder';
import Student from '../models/Student';
import Enrollment from '../models/Enrollment';
import AnswerHelpMail from '../jobs/AnswerHelpMail';
import Queue from '../../lib/Queue';

class HelpOrderController {
  async index(req, res) {
    const helpOrders = await HelpOrder.findAll({
      where: { answer: null },
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'name', 'email', 'age', 'height', 'weight'],
        },
      ],
    });
    return res.json(helpOrders);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      question: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const student_id = req.params.id;

    const student = await Student.findByPk(student_id);

    if (!student) {
      res.status(400).json({ error: 'Student does not exist' });
    }

    const enrollmentExists = await Enrollment.findOne({
      where: { student_id },
    });

    if (!enrollmentExists) {
      return res.status(400).json({ error: 'Student is not enrolled.' });
    }
    const { question } = req.body;
    const helpOrder = await HelpOrder.create({ question, student_id });

    return res.json(helpOrder);
  }

  async show(req, res) {
    const helpOrders = await HelpOrder.findAll({
      where: { student_id: req.params.id },
      attributes: ['question', 'answer', 'answer_at', 'created_at'],
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'name', 'email', 'age', 'height', 'weight'],
        },
      ],
    });
    return res.json(helpOrders);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      answer: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { id } = req.params;

    const helpOrder = await HelpOrder.findOne({
      where: { id },
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['name', 'email'],
        },
      ],
    });

    if (!helpOrder) {
      return res.status(400).json({ message: 'Help order does not exists' });
    }

    if (helpOrder.answer) {
      return res.status(400).json({ error: 'Question already answered' });
    }

    const response = await helpOrder.update({
      answer: req.body.answer,
      answer_at: new Date(),
    });

    await Queue.add(AnswerHelpMail.key, {
      response,
      answer_at: new Date(),
    });

    return res.json(response);
  }
}

export default new HelpOrderController();
