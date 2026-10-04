from datetime import timedelta

from odoo import fields
from odoo.tests import TransactionCase, tagged


@tagged("post_install", "-at_install")
class TestLahza(TransactionCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        params = cls.env["ir.config_parameter"].sudo()
        set_param = params.set_str if hasattr(params, "set_str") else params.set_param  # renamed in Odoo 20
        set_param("lahza_onboarding.url", "https://lahza.example/")
        set_param("lahza_onboarding.company_code", "Naqlah")
        cls.env["lahza.moment"].search([]).write({"active": False})
        users = cls.env["res.users"].with_context(no_reset_password=True)
        cls.user = users.create({"name": "Khalid", "login": "khalid@lahza.example", "lang": "en_US"})
        cls.user.partner_id.lang = "en_US"
        cls.employee = cls.env["hr.employee"].create({"name": "Khalid", "user_id": cls.user.id})
        cls.no_user = cls.env["hr.employee"].create({"name": "No user"})
        cls.today = fields.Date.context_today(cls.env["lahza.moment"])

    def _activities(self, employee):
        return self.env["mail.activity"].search([("res_model", "=", "hr.employee"), ("res_id", "=", employee.id), ("note", "like", "lahza.example")])

    def test_button_opens_welcome_with_company_code(self):
        action = self.employee.action_open_lahza()
        self.assertEqual(action["type"], "ir.actions.act_url")
        self.assertEqual(action["url"], "https://lahza.example/en?c=naqlah")

    def test_reminder_inside_the_window_once(self):
        moment = self.env["lahza.moment"].create({"journey": "ramadan", "date": self.today + timedelta(days=2), "days_before": 3})
        self.env["lahza.moment"]._cron_notify()
        activities = self._activities(self.employee)
        self.assertEqual(len(activities), 1)
        self.assertEqual(activities.user_id, self.user)
        self.assertEqual(activities.date_deadline, moment.date)
        self.assertIn("https://lahza.example/en/j/ramadan", activities.note)
        self.assertTrue(moment.notified)
        self.assertFalse(self._activities(self.no_user))
        self.env["lahza.moment"]._cron_notify()
        self.assertEqual(len(self._activities(self.employee)), 1, "a second run must not remind again")

    def test_no_reminder_too_early_or_after(self):
        self.env["lahza.moment"].create({"journey": "eid", "date": self.today + timedelta(days=10), "days_before": 3})
        self.env["lahza.moment"].create({"journey": "eid", "date": self.today - timedelta(days=1), "days_before": 3})
        self.env["lahza.moment"]._cron_notify()
        self.assertFalse(self._activities(self.employee))

    def test_arabic_and_urdu_users_get_their_language(self):
        self.env["res.lang"]._activate_lang("ar_001")
        # Odoo ships no Urdu; a company that wants it adds the language itself.
        self.env["res.lang"].create({"name": "Urdu", "code": "ur_PK", "iso_code": "ur", "direction": "rtl", "active": True})
        self.user.lang = "ar_001"
        urdu = self.env["res.users"].with_context(no_reset_password=True).create({"name": "Ali", "login": "ali@lahza.example", "lang": "ur_PK"})
        urdu_employee = self.env["hr.employee"].create({"name": "Ali", "user_id": urdu.id})
        self.env["lahza.moment"].create({"journey": "ramadan", "date": self.today, "days_before": 3})
        self.env["lahza.moment"]._cron_notify()
        self.assertEqual(self._activities(self.employee).summary, "لحظة: رمضان قرّب، 3 دقائق")
        self.assertIn("/ar/j/ramadan", self._activities(self.employee).note)
        self.assertEqual(self._activities(urdu_employee).summary, "لحظہ: رمضان قریب ہے، 3 منٹ")
        self.assertEqual(self.employee.action_open_lahza()["url"], "https://lahza.example/ar?c=naqlah")
