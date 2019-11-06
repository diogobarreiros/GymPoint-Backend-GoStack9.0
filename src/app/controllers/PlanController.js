import * as Yup from 'yup';
import Plan from '../models/Plan';

class PlanController {
  async index(req, res) {
    const { page = 1 } = req.query;
    const { pageLimit = 20 } = req.query;

    const plans = await Plan.findAll({
      order: ['id'],
      limit: pageLimit,
      offset: (page - 1) * pageLimit,
      attributes: ['id', 'title', 'duration', 'price'],
    });

    return res.json(plans);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      duration: Yup.number()
        .integer()
        .required(),
      price: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const planExists = await Plan.findOne({
      where: { title: req.body.title },
    });

    if (planExists) {
      return res.status(400).json({ error: 'Plan already exists.' });
    }

    const plan = await Plan.create(req.body);

    return res.json(plan);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      id: Yup.number()
        .integer()
        .required(),
      title: Yup.string(),
      duration: Yup.number().integer(),
      price: Yup.number(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const plan = await Plan.findOne({ where: { id: req.body.id } });

    if (!plan) {
      return res.status(400).json({ error: 'Plan does not exists' });
    }

    const title = req.body.title != null ? req.body.title : plan.title;

    if (title !== plan.title) {
      const planExists = await Plan.findOne({ where: { title } });

      if (planExists) {
        return res.status(400).json({ error: 'Plan already exists.' });
      }
    }

    const planUpdate = await plan.update(req.body);

    return res.json(planUpdate);
  }

  async delete(req, res) {
    const plan = await Plan.findByPk(req.params.id);

    if (!plan) {
      return res.status(400).json({ error: 'Plan does not exists' });
    }

    await plan.destroy();

    return res.json({ message: 'Plan deleted' });
  }
}

export default new PlanController();
