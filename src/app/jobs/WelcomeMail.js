import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale/pt';
import Mail from '../../lib/Mail';

class WelcomeMail {
  get key() {
    return 'WelcomeMail';
  }

  async handle({ data }) {
    const { student, plan, price, end_date } = data;

    await Mail.sendMail({
      to: `${student.name} <${student.email}>`,
      subject: 'Bem Vindo à GymPoint',
      template: 'welcome',
      context: {
        student: student.name,
        plan: plan.title,
        price,
        end_date: format(parseISO(end_date), "'dia' dd 'de' MMMM 'de' Y", {
          locale: pt,
        }),
      },
    });
  }
}

export default new WelcomeMail();
