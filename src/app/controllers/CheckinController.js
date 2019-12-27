import { subDays } from 'date-fns';
import Checkin from '../schemas/Checkin';
import Student from '../models/Student';

class CheckinController {
  async store(req, res) {
    const { id } = req.params;

    const studentExist = await Student.findByPk(id);
    if (!studentExist) {
      return res.status(400).json({ error: 'Student does not exist' });
    }

    const daysAgo = subDays(new Date(), 7);
    const verifyCheckIn = await Checkin.find({
      student_id: id,
      createdAt: {
        $gte: daysAgo,
        $lte: new Date(),
      },
    }).count();

    if (verifyCheckIn === 5) {
      return res.status(400).json({
        error: 'Student can only do 5 checkins within 7 calendar days',
      });
    }

    const checkin = await Checkin.create({
      student_id: id,
    });

    return res.json(checkin);
  }

  async index(req, res) {
    const { page = 1 } = req.query;
    const { pageLimit = 20 } = req.query;

    const checkins = await Checkin.find({
      student_id: req.params.id,
    })
      .sort({ createdAt: 'desc' })
      .skip(Number((page - 1) * pageLimit))
      .limit(Number(pageLimit));

    return res.json(checkins);
  }
}

export default new CheckinController();
