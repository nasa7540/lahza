from datetime import timedelta
from html import escape

from odoo import api, fields, models

from .lahza import JOURNEYS, NAMES, REMINDER, journey_url, lahza_lang


class LahzaMoment(models.Model):
    """A dated moment (Ramadan, Eid). A few days before it, every employee with a user gets a short activity."""

    _name = "lahza.moment"
    _description = "Lahza moment"
    _order = "date"

    journey = fields.Selection(JOURNEYS, required=True)
    date = fields.Date(required=True, help="First day of the moment. The seeded dates follow the Umm al-Qura calendar; adjust them when the official announcement differs.")
    days_before = fields.Integer(default=3, required=True)
    notified = fields.Boolean(readonly=True, copy=False, help="Set once the activities were created, so they are created only once.")
    active = fields.Boolean(default=True)

    @api.depends("journey", "date")
    def _compute_display_name(self):
        labels = dict(JOURNEYS)
        for moment in self:
            moment.display_name = f"{labels.get(moment.journey, '')} {moment.date or ''}".strip()

    @api.model
    def _cron_notify(self):
        today = fields.Date.context_today(self)
        for moment in self.search([("notified", "=", False), ("date", ">=", today)]):
            if moment.date - timedelta(days=moment.days_before) <= today:
                moment._notify()

    def _notify(self):
        self.ensure_one()
        employees = self.env["hr.employee"].search([("user_id", "!=", False)])
        for employee in employees:
            lang = lahza_lang(employee.user_id.lang)
            text = REMINDER[lang]
            name = NAMES[self.journey][lang]
            url = journey_url(self.env, lang, self.journey)
            note = f'<p>{escape(text["note"].format(name=name, date=self.date))}</p><p><a href="{escape(url)}" target="_blank">{escape(text["link"])}</a></p>'
            employee.activity_schedule(
                "mail.mail_activity_data_todo",
                date_deadline=self.date,
                summary=text["summary"].format(name=name),
                note=note,
                user_id=employee.user_id.id,
            )
        self.notified = True
