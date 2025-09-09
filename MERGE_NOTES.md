
# ادغام کامل قابلیت‌های ML در پروژهٔ اصلی

این نسخه شامل:
- API پیش‌بینی واقعی (تکی/گروهی + PDF) با مدل فعال و آزمایش A/B
- رجیستری مدل‌ها و Promote/Activate (Single/A/B)
- Feature Flag برای A/B (`/api/flags/predict_ab`)
- آموزش پیشرفته با Calibration (Platt/Isotonic) و خروجی SHAP Summary
- نمودارهای SHAP Dependence
- ادغام UI در پنل مدیریت و صفحهٔ نتایج ارزیابی

## اجرای سریع
1) نصب وابستگی‌ها
```bash
# ریشه پروژه
npm install
cd server && npm install && cd ..
# اگر پایتون ندارید، نصب کنید
pip install -r server/scripts/requirements.txt  # اگر فایل وجود ندارد: pip install scikit-learn shap joblib pandas numpy matplotlib
```

2) اجرا
```bash
# سرور
npm run start-server  # یا طبق README اصلی‌تان
# فرانت (Vite)
npm run dev
```

3) آموزش/پروموت
- از پنل مدیریت → پنل‌های ML (افزوده‌شده) را ببینید.
- Promote را برای فعال‌سازی Production یا واریانت A/B بزنید.
- Flag A/B را از پنل A/B روشن/خاموش کنید.

4) پیش‌بینی کاربر
- صفحه «assessment-results» شامل کارت «Predict» جدید است. ID ارزیابی را وارد کنید و Predict را بزنید.
