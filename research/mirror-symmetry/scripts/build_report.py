"""Inject report_data.json into the HTML template -> report/mirror_mechanics.html"""
import os, json
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
tpl = open(os.path.join(ROOT, "report", "template.html"), encoding="utf-8").read()
data = open(os.path.join(ROOT, "report", "report_data.json"), encoding="utf-8").read().replace("</", "<\\/")
out = tpl.replace("/*__DATA__*/", data)
open(os.path.join(ROOT, "report", "mirror_mechanics.html"), "w", encoding="utf-8").write(out)
print("wrote", len(out), "bytes")
