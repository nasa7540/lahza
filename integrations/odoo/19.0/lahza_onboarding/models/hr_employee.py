from odoo import models

from .lahza import lahza_lang, welcome_url


class HrEmployee(models.Model):
    _inherit = "hr.employee"

    def action_open_lahza(self):
        self.ensure_one()
        lang = lahza_lang(self.user_id.lang or self.env.user.lang)
        return {"type": "ir.actions.act_url", "url": welcome_url(self.env, lang), "target": "new"}
