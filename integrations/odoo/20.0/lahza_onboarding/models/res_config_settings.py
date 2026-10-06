from odoo import fields, models

from .lahza import DEFAULT_URL


class ResConfigSettings(models.TransientModel):
    _inherit = "res.config.settings"

    lahza_url = fields.Char(string="Lahza link", config_parameter="lahza_onboarding.url", default=DEFAULT_URL)
    lahza_company_code = fields.Char(string="Lahza company code", config_parameter="lahza_onboarding.company_code")
