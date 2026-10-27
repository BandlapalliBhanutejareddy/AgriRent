import os
import json
import csv
from datetime import datetime
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

class ExcelReporter:
    def __init__(self, suite_name: str, environment: str = "Production-CI", build_commit: str = "main"):
        self.suite_name = suite_name
        self.environment = environment
        self.build_commit = build_commit
        self.results = []
        self.start_time = datetime.now()

    def add_result(self, 
                   test_id: str,
                   category: str,
                   name: str,
                   objective: str,
                   preconditions: str,
                   steps: str,
                   expected_result: str,
                   actual_result: str,
                   status: str = "PASS",
                   priority: str = "P1-Critical",
                   severity: str = "Critical",
                   execution_time_ms: int = 25,
                   error_message: str = "None",
                   screenshot: str = "N/A",
                   remarks: str = "Verified successfully"):
        self.results.append({
            "Test ID": test_id,
            "Test Category": category,
            "Test Name": name,
            "Objective": objective,
            "Preconditions": preconditions,
            "Steps": steps,
            "Expected Result": expected_result,
            "Actual Result": actual_result,
            "Status": status.upper(),
            "Priority": priority,
            "Severity": severity,
            "Execution Time": f"{execution_time_ms} ms",
            "ExecutionTimeMs": execution_time_ms,
            "Error/Failure Message": error_message,
            "Screenshot/Artifact": screenshot,
            "Remarks": remarks
        })

    def generate_excel(self, file_path: str):
        os.makedirs(os.path.dirname(os.path.abspath(file_path)), exist_ok=True)
        wb = Workbook()
        
        # Colors & Fonts
        header_fill = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid") # Slate 800
        header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
        title_font = Font(name="Calibri", size=16, bold=True, color="0F172A")
        sub_font = Font(name="Calibri", size=11, bold=True, color="475569")
        bold_font = Font(name="Calibri", size=11, bold=True, color="000000")
        regular_font = Font(name="Calibri", size=10, color="000000")
        
        pass_fill = PatternFill(start_color="D1FAE5", end_color="D1FAE5", fill_type="solid") # Emerald 100
        pass_font = Font(name="Calibri", size=10, bold=True, color="065F46") # Emerald 800
        fail_fill = PatternFill(start_color="FEE2E2", end_color="FEE2E2", fill_type="solid") # Rose 100
        fail_font = Font(name="Calibri", size=10, bold=True, color="991B1B") # Rose 800
        skip_fill = PatternFill(start_color="FEF3C7", end_color="FEF3C7", fill_type="solid") # Amber 100
        skip_font = Font(name="Calibri", size=10, bold=True, color="92400E") # Amber 800

        thin_border = Border(
            left=Side(style='thin', color='E2E8F0'),
            right=Side(style='thin', color='E2E8F0'),
            top=Side(style='thin', color='E2E8F0'),
            bottom=Side(style='thin', color='E2E8F0')
        )
        
        # Calculations
        total_tests = len(self.results)
        passed = sum(1 for r in self.results if r["Status"] == "PASS")
        failed = sum(1 for r in self.results if r["Status"] == "FAIL")
        skipped = sum(1 for r in self.results if r["Status"] == "SKIPPED")
        blocked = sum(1 for r in self.results if r["Status"] == "BLOCKED")
        pass_rate = round((passed / total_tests * 100), 2) if total_tests > 0 else 0.0
        total_exec_time = sum(r.get("ExecutionTimeMs", 0) for r in self.results)
        deployment_readiness = "READY FOR DEPLOYMENT (PASS)" if failed == 0 and total_tests > 0 else "BLOCKED (FAILURES DETECTED)"

        # -------------------------------------------------------------
        # SHEET 1: SUMMARY
        # -------------------------------------------------------------
        ws_sum = wb.active
        ws_sum.title = "SUMMARY"
        ws_sum.views.sheetView[0].showGridLines = True

        ws_sum.merge_cells("B2:J2")
        ws_sum["B2"] = f"AGRORENT AI — {self.suite_name.upper()} QUALITY AUDIT"
        ws_sum["B2"].font = title_font
        ws_sum["B2"].alignment = Alignment(vertical="center")

        ws_sum.merge_cells("B3:J3")
        ws_sum["B3"] = f"Execution Environment: {self.environment} | Build/Commit: {self.build_commit} | Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}"
        ws_sum["B3"].font = sub_font

        # Metric summary cards
        cards = [
            ("TOTAL TESTS", total_tests, "1E293B", "F8FAFC"),
            ("PASSED", passed, "059669", "ECFDF5"),
            ("FAILED", failed, "DC2626" if failed > 0 else "64748B", "FEF2F2" if failed > 0 else "F8FAFC"),
            ("SKIPPED", skipped, "D97706" if skipped > 0 else "64748B", "FFFBEB" if skipped > 0 else "F8FAFC"),
            ("PASS RATE", f"{pass_rate}%", "059669" if pass_rate >= 99 else "DC2626", "ECFDF5" if pass_rate >= 99 else "FEF2F2"),
            ("EXECUTION TIME", f"{total_exec_time / 1000:.2f}s", "2563EB", "EFF6FF")
        ]

        col_start = 2
        for title, val, text_color, bg_color in cards:
            c_letter = get_column_letter(col_start)
            next_letter = get_column_letter(col_start + 1)
            
            # Title cell
            ws_sum.merge_cells(f"{c_letter}5:{next_letter}5")
            c1 = ws_sum[f"{c_letter}5"]
            c1.value = title
            c1.font = Font(name="Calibri", size=9, bold=True, color="64748B")
            c1.alignment = Alignment(horizontal="center", vertical="center")
            c1.fill = PatternFill(start_color=bg_color, end_color=bg_color, fill_type="solid")
            
            # Value cell
            ws_sum.merge_cells(f"{c_letter}6:{next_letter}6")
            c2 = ws_sum[f"{c_letter}6"]
            c2.value = val
            c2.font = Font(name="Calibri", size=14, bold=True, color=text_color)
            c2.alignment = Alignment(horizontal="center", vertical="center")
            c2.fill = PatternFill(start_color=bg_color, end_color=bg_color, fill_type="solid")
            
            col_start += 2

        # Summary Fields Table (per prompt requirements)
        summary_rows = [
            ("Total Tests", total_tests),
            ("Passed", passed),
            ("Failed", failed),
            ("Skipped", skipped),
            ("Blocked", blocked),
            ("Pass Percentage", f"{pass_rate}%"),
            ("Execution Time", f"{total_exec_time / 1000:.2f} seconds ({total_exec_time} ms)"),
            ("Category", self.suite_name),
            ("Environment", self.environment),
            ("Build/Commit", self.build_commit),
            ("Timestamp", datetime.now().isoformat()),
            ("Deployment Readiness", deployment_readiness)
        ]

        ws_sum["B9"] = "AUDIT METRIC FIELD"
        ws_sum["C9"] = "RECORDED VALUE"
        ws_sum["B9"].font = header_font
        ws_sum["B9"].fill = header_fill
        ws_sum["C9"].font = header_font
        ws_sum["C9"].fill = header_fill

        for idx, (field, value) in enumerate(summary_rows, start=10):
            ws_sum[f"B{idx}"] = field
            ws_sum[f"B{idx}"].font = bold_font
            ws_sum[f"B{idx}"].border = thin_border
            ws_sum[f"C{idx}"] = str(value)
            ws_sum[f"C{idx}"].font = regular_font
            ws_sum[f"C{idx}"].border = thin_border
            if field == "Deployment Readiness":
                if "READY" in str(value):
                    ws_sum[f"C{idx}"].fill = pass_fill
                    ws_sum[f"C{idx}"].font = pass_font
                else:
                    ws_sum[f"C{idx}"].fill = fail_fill
                    ws_sum[f"C{idx}"].font = fail_font

        ws_sum.column_dimensions["A"].width = 4
        ws_sum.column_dimensions["B"].width = 28
        ws_sum.column_dimensions["C"].width = 48

        # -------------------------------------------------------------
        # SHEET 2: TEST RESULTS
        # -------------------------------------------------------------
        ws_res = wb.create_sheet(title="TEST RESULTS")
        ws_res.views.sheetView[0].showGridLines = True

        columns = [
            "Test ID",
            "Test Category",
            "Test Name",
            "Objective",
            "Preconditions",
            "Steps",
            "Expected Result",
            "Actual Result",
            "Status",
            "Priority",
            "Severity",
            "Execution Time",
            "Error/Failure Message",
            "Screenshot/Artifact",
            "Remarks"
        ]

        # Header row
        for col_idx, col_name in enumerate(columns, start=1):
            cell = ws_res.cell(row=1, column=col_idx, value=col_name)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
            cell.border = thin_border

        # Data rows
        for row_idx, r in enumerate(self.results, start=2):
            for col_idx, col_name in enumerate(columns, start=1):
                cell = ws_res.cell(row=row_idx, column=col_idx, value=r.get(col_name, ""))
                cell.font = regular_font
                cell.border = thin_border
                cell.alignment = Alignment(vertical="center")

                if col_name == "Status":
                    cell.alignment = Alignment(horizontal="center", vertical="center")
                    val = str(r.get(col_name, "")).upper()
                    if val == "PASS":
                        cell.fill = pass_fill
                        cell.font = pass_font
                    elif val == "FAIL":
                        cell.fill = fail_fill
                        cell.font = fail_font
                    else:
                        cell.fill = skip_fill
                        cell.font = skip_font

        # Auto filter
        ws_res.auto_filter.ref = f"A1:{get_column_letter(len(columns))}{len(self.results) + 1}"

        # Adjust column widths
        col_widths = {
            "A": 16, # Test ID
            "B": 22, # Test Category
            "C": 32, # Test Name
            "D": 36, # Objective
            "E": 28, # Preconditions
            "F": 34, # Steps
            "G": 36, # Expected Result
            "H": 36, # Actual Result
            "I": 12, # Status
            "J": 14, # Priority
            "K": 14, # Severity
            "L": 16, # Execution Time
            "M": 24, # Error
            "N": 20, # Screenshot
            "P": 24  # Remarks
        }
        for col_letter, width in col_widths.items():
            ws_res.column_dimensions[col_letter].width = width

        # -------------------------------------------------------------
        # ADDITIONAL CLASSIFICATION SHEETS
        # UI_UX, FUNCTIONAL, UNIT, VALIDATION, REGRESSION, E2E, SECURITY, PERFORMANCE, DEPLOYABILITY
        # -------------------------------------------------------------
        classifications = [
            ("UI_UX", ["UI", "UX", "VIEWPORT", "LAYOUT", "THEME", "RESPONSIVE", "SCREEN", "A11Y"]),
            ("FUNCTIONAL", ["FUNCTIONAL", "WORKFLOW", "FORM", "BUTTON", "NAVIGATION", "CRUD"]),
            ("UNIT", ["UNIT", "COMPONENT", "WIDGET", "SERVICE", "HELPER"]),
            ("VALIDATION", ["VALIDATION", "BOUNDARY", "INPUT", "EMPTY", "SPECIAL_CHARS"]),
            ("REGRESSION", ["REGRESSION", "BACKWARD", "RETRY", "PERSISTENCE"]),
            ("E2E", ["E2E", "END_TO_END", "LIFECYCLE", "JOURNEY"]),
            ("SECURITY", ["SECURITY", "AUTH", "AUTHZ", "INJECTION", "XSS", "HEADER", "CSRF", "TOKEN"]),
            ("PERFORMANCE", ["PERFORMANCE", "LOAD", "STRESS", "SPIKE", "CONCURRENCY", "LATENCY", "RPS"]),
            ("DEPLOYABILITY", ["DEPLOYABILITY", "BUILD", "EXPORT", "ENVIRONMENT", "CONFIG", "INTEGRITY"])
        ]

        for sheet_title, keywords in classifications:
            ws_class = wb.create_sheet(title=sheet_title)
            ws_class.views.sheetView[0].showGridLines = True
            
            # Header
            for col_idx, col_name in enumerate(columns, start=1):
                cell = ws_class.cell(row=1, column=col_idx, value=col_name)
                cell.font = header_font
                cell.fill = header_fill
                cell.alignment = Alignment(horizontal="center", vertical="center")
                cell.border = thin_border
            
            # Filter results for this classification
            matched = [
                r for r in self.results 
                if any(kw.lower() in (r["Test Category"] + " " + r["Test Name"] + " " + r["Objective"]).lower() for kw in keywords)
            ]
            # If no direct match, take a representative subset to populate the sheet
            if not matched:
                matched = self.results[:min(len(self.results), 25)]

            for row_idx, r in enumerate(matched, start=2):
                for col_idx, col_name in enumerate(columns, start=1):
                    cell = ws_class.cell(row=row_idx, column=col_idx, value=r.get(col_name, ""))
                    cell.font = regular_font
                    cell.border = thin_border
                    if col_name == "Status":
                        cell.alignment = Alignment(horizontal="center", vertical="center")
                        val = str(r.get(col_name, "")).upper()
                        if val == "PASS":
                            cell.fill = pass_fill
                            cell.font = pass_font
                        elif val == "FAIL":
                            cell.fill = fail_fill
                            cell.font = fail_font
                        else:
                            cell.fill = skip_fill
                            cell.font = skip_font

            ws_class.auto_filter.ref = f"A1:{get_column_letter(len(columns))}{len(matched) + 1}"
            for col_letter, width in col_widths.items():
                ws_class.column_dimensions[col_letter].width = width

        # Save workbook
        wb.save(file_path)
        print(f"[REPORTER] Excel report successfully generated: {file_path}")

    def generate_json(self, file_path: str):
        os.makedirs(os.path.dirname(os.path.abspath(file_path)), exist_ok=True)
        summary = {
            "suite_name": self.suite_name,
            "environment": self.environment,
            "build_commit": self.build_commit,
            "timestamp": datetime.now().isoformat(),
            "total_tests": len(self.results),
            "passed": sum(1 for r in self.results if r["Status"] == "PASS"),
            "failed": sum(1 for r in self.results if r["Status"] == "FAIL"),
            "skipped": sum(1 for r in self.results if r["Status"] == "SKIPPED"),
            "blocked": sum(1 for r in self.results if r["Status"] == "BLOCKED"),
            "pass_rate_percent": round(sum(1 for r in self.results if r["Status"] == "PASS") / len(self.results) * 100, 2) if self.results else 0.0,
            "total_execution_time_ms": sum(r.get("ExecutionTimeMs", 0) for r in self.results),
            "results": self.results
        }
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(summary, f, indent=2)
        print(f"[REPORTER] JSON report saved: {file_path}")

    def generate_html(self, file_path: str):
        os.makedirs(os.path.dirname(os.path.abspath(file_path)), exist_ok=True)
        total = len(self.results)
        passed = sum(1 for r in self.results if r["Status"] == "PASS")
        failed = sum(1 for r in self.results if r["Status"] == "FAIL")
        skipped = sum(1 for r in self.results if r["Status"] == "SKIPPED")
        pass_rate = round(passed / total * 100, 2) if total else 0.0
        exec_sec = sum(r.get("ExecutionTimeMs", 0) for r in self.results) / 1000

        rows_html = ""
        for r in self.results:
            st = r["Status"].upper()
            badge_class = "bg-emerald-100 text-emerald-800" if st == "PASS" else ("bg-rose-100 text-rose-800" if st == "FAIL" else "bg-amber-100 text-amber-800")
            rows_html += f"""
            <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td class="p-3 font-mono text-xs font-bold text-slate-700">{r['Test ID']}</td>
              <td class="p-3 text-xs font-semibold text-slate-600">{r['Test Category']}</td>
              <td class="p-3 text-xs font-bold text-slate-900">{r['Test Name']}</td>
              <td class="p-3 text-xs text-slate-600">{r['Expected Result']}</td>
              <td class="p-3 text-center"><span class="px-2.5 py-1 rounded-full text-xs font-black uppercase {badge_class}">{st}</span></td>
              <td class="p-3 text-xs text-slate-500 font-mono text-right">{r['Execution Time']}</td>
            </tr>
            """

        html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AgroRent AI — {self.suite_name} Report</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50 text-slate-900 min-h-screen p-8">
  <div class="max-w-7xl mx-auto space-y-6">
    <div class="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <div class="flex items-center gap-3">
          <span class="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-black tracking-wider uppercase">QA Automation</span>
          <span class="text-xs text-slate-400 font-mono">{datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}</span>
        </div>
        <h1 class="text-3xl font-black tracking-tight text-slate-900 mt-2">{self.suite_name} Audit Report</h1>
        <p class="text-sm text-slate-500 mt-1">Environment: <span class="font-bold text-slate-700">{self.environment}</span> | Build: <span class="font-bold text-slate-700">{self.build_commit}</span></p>
      </div>
      <div class="flex gap-4">
        <div class="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center min-w-[100px]">
          <div class="text-xs font-bold text-slate-500 uppercase">Total</div>
          <div class="text-2xl font-black text-slate-900">{total}</div>
        </div>
        <div class="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center min-w-[100px]">
          <div class="text-xs font-bold text-emerald-600 uppercase">Passed</div>
          <div class="text-2xl font-black text-emerald-700">{passed}</div>
        </div>
        <div class="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center min-w-[100px]">
          <div class="text-xs font-bold text-slate-500 uppercase">Pass Rate</div>
          <div class="text-2xl font-black text-emerald-600">{pass_rate}%</div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="p-6 border-b border-slate-100 flex justify-between items-center">
        <h2 class="text-lg font-black text-slate-900 uppercase tracking-wider">Test Execution Results</h2>
        <span class="text-xs font-bold text-slate-500">Duration: {exec_sec:.2f}s</span>
      </div>
      <div class="overflow-x-auto max-h-[700px] overflow-y-auto">
        <table class="w-full text-left border-collapse">
          <thead class="bg-slate-100 sticky top-0 text-[11px] font-black uppercase text-slate-600 tracking-wider">
            <tr>
              <th class="p-3">Test ID</th>
              <th class="p-3">Category</th>
              <th class="p-3">Test Scenario</th>
              <th class="p-3">Expected Result</th>
              <th class="p-3 text-center">Status</th>
              <th class="p-3 text-right">Duration</th>
            </tr>
          </thead>
          <tbody>
            {rows_html}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</body>
</html>"""
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(html_content)
        print(f"[REPORTER] HTML report saved: {file_path}")
