import * as Yup from 'yup';
import { addMonths, parseISO, format } from 'date-fns';
import Enrollment from '../models/Enrollment';
import Student from '../models/Student';
import Plan from '../models/Plan';

import WelcomeMail from '../jobs/WelcomeMail';
import Queue from '../../lib/Queue';

class EnrollmentController {
  async index(req, res) {
    const { page = 1 } = req.query;
    const { pageLimit = 20 } = req.query;

    const enrollments = await Enrollment.findAll({
      order: ['id'],
      limit: pageLimit,
      offset: (page - 1) * pageLimit,
      attributes: ['id', 'start_date', 'end_date', 'price', 'active'],
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'name', 'email', 'age', 'height', 'weight'],
        },
        {
          model: Plan,
          as: 'plan',
          attributes: ['id', 'title', 'duration', 'price'],
        },
      ],
    });

    return res.json(enrollments);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      student_id: Yup.number()
        .integer()
        .required(),
      plan_id: Yup.number()
        .integer()
        .required(),
      start_date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { student_id, plan_id, start_date } = req.body;

    const student = await Student.findByPk(student_id);
    if (!student) {
      return res.status(400).json({ error: 'Student does not exist' });
    }

    const enrollmentExists = await Enrollment.findOne({
      where: { student_id },
    });

    if (enrollmentExists) {
      return res.status(400).json({ error: 'Student already has enrollment.' });
    }

    const plan = await Plan.findOne({
      where: { id: plan_id },
    });

    if (!plan) {
      return res.status(400).json({ error: 'Plan does not exists.' });
    }

    const end_date = addMonths(parseISO(start_date), Number(plan.duration));
    const price = Number(plan.price) * Number(plan.duration);

    const enrollment = await Enrollment.create({
      student_id,
      plan_id,
      start_date,
      end_date,
      price,
    });

    await Queue.add(WelcomeMail.key, {
      student,
      plan,
      price,
      end_date,
    });

    return res.json(enrollment);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      student_id: Yup.number().integer(),
      plan_id: Yup.number().integer(),
      start_date: Yup.date(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { id } = req.params;

    const enrollment = await Enrollment.findOne({ where: { id } });

    if (!enrollment) {
      return res.status(400).json({ error: 'Enrollment does not exists.' });
    }

    const student_id =
      req.body.student_id != null ? req.body.student_id : enrollment.student_id;

    if (Number(student_id) !== enrollment.student_id) {
      const studentExists = await Student.findOne({
        where: { id: student_id },
      });

      if (!studentExists) {
        return res.status(400).json({ error: 'Student does not exists.' });
      }

      const enrollmentExists = await Enrollment.findOne({
        where: { student_id },
      });

      if (enrollmentExists) {
        return res
          .status(400)
          .json({ error: 'Student already has enrollment.' });
      }
    }

    const plan_id =
      req.body.plan_id != null ? req.body.plan_id : enrollment.plan_id;

    const plan = await Plan.findOne({ where: { id: plan_id } });

    if (plan_id !== enrollment.plan_id) {
      if (!plan) {
        return res.status(400).json({ error: 'Plan does not exists.' });
      }
    }

    const start_date =
      req.body.start_date != null
        ? req.body.start_date
        : format(enrollment.start_date, "yyyy-MM-dd'T'HH:mm:ssxxx");

    const enrollmentUpdate = await enrollment.update({
      student_id,
      plan_id,
      start_date,
      end_date: addMonths(parseISO(start_date), Number(plan.duration)),
      price: Number(plan.price) * Number(plan.duration),
    });

    return res.json(enrollmentUpdate);
  }

  async delete(req, res) {
    const enrollment = await Enrollment.findByPk(req.params.id);

    if (!enrollment) {
      return res.status(400).json({ error: 'Enrollment does not exists' });
    }

    await enrollment.destroy();

    return res.json({ message: 'Enrollment deleted' });
  }
}

export default new EnrollmentController();
