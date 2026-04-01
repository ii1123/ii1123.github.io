import json
import os
import shutil
import sqlite3
import sys
from datetime import datetime
from pathlib import Path

from PyQt5.QtCore import QDate, QTimer, Qt
from PyQt5.QtGui import QFont
from PyQt5.QtWidgets import (
    QApplication,
    QCalendarWidget,
    QComboBox,
    QDateEdit,
    QFileDialog,
    QFrame,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QListWidget,
    QListWidgetItem,
    QMainWindow,
    QMessageBox,
    QPushButton,
    QTabWidget,
    QTextEdit,
    QVBoxLayout,
    QWidget,
)


class CoupleApp(QMainWindow):
    def __init__(self):
        super().__init__()
        self.base_dir = Path.home() / "CoupleApp"
        self.base_dir.mkdir(exist_ok=True)
        self.settings_path = self.base_dir / "settings.json"
        self.settings = self.load_settings()

        self.data_dir = self.resolve_data_dir()
        self.files_dir = self.data_dir / "files"
        self.db_path = self.data_dir / "couple_data.db"

        self.ensure_storage()
        self.init_database()
        self.init_ui()
        self.load_all_data()
        self.start_auto_refresh()

    def load_settings(self):
        default_settings = {
            "your_name": "أنا",
            "partner_name": "حبيبتي",
            "shared_folder": "",
        }
        if self.settings_path.exists():
            try:
                with self.settings_path.open("r", encoding="utf-8") as file:
                    stored = json.load(file)
                default_settings.update(stored)
            except (json.JSONDecodeError, OSError):
                pass
        return default_settings

    def save_settings_file(self):
        with self.settings_path.open("w", encoding="utf-8") as file:
            json.dump(self.settings, file, ensure_ascii=False, indent=2)

    def resolve_data_dir(self):
        shared_folder = self.settings.get("shared_folder", "").strip()
        if shared_folder:
            return Path(shared_folder).expanduser()
        return self.base_dir / "shared_data"

    def ensure_storage(self):
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.files_dir.mkdir(parents=True, exist_ok=True)

    def init_database(self):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()

        c.execute(
            """
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY,
                sender TEXT,
                message TEXT,
                timestamp TEXT
            )
            """
        )
        c.execute(
            """
            CREATE TABLE IF NOT EXISTS files (
                id INTEGER PRIMARY KEY,
                file_name TEXT,
                file_path TEXT,
                uploaded_by TEXT,
                timestamp TEXT
            )
            """
        )
        c.execute(
            """
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY,
                title TEXT,
                description TEXT,
                date TEXT,
                created_by TEXT
            )
            """
        )
        c.execute(
            """
            CREATE TABLE IF NOT EXISTS diary (
                id INTEGER PRIMARY KEY,
                author TEXT,
                content TEXT,
                date TEXT
            )
            """
        )
        c.execute(
            """
            CREATE TABLE IF NOT EXISTS challenges (
                id INTEGER PRIMARY KEY,
                title TEXT,
                description TEXT,
                creator TEXT,
                completed_by TEXT,
                date TEXT
            )
            """
        )

        conn.commit()
        conn.close()

    def people_options(self):
        return [
            self.settings.get("your_name", "أنا").strip() or "أنا",
            self.settings.get("partner_name", "حبيبتي").strip() or "حبيبتي",
        ]

    def init_ui(self):
        self.setWindowTitle("مساحتنا الخاصة")
        self.setLayoutDirection(Qt.RightToLeft)
        self.resize(1180, 760)
        self.setStyleSheet(
            """
            QMainWindow {
                background: #fffaf7;
            }
            QFrame#heroCard, QFrame#panelCard {
                background: white;
                border: 1px solid #f1d8d5;
                border-radius: 18px;
            }
            QLabel#heroTitle {
                color: #7f3d3b;
                font-size: 24px;
                font-weight: 700;
            }
            QLabel#heroSubTitle {
                color: #8a6a68;
                font-size: 13px;
            }
            QTabWidget::pane {
                border: 1px solid #edd4d0;
                background: transparent;
                border-radius: 18px;
                top: -1px;
            }
            QTabBar::tab {
                background: #f7e3df;
                color: #7a504d;
                min-width: 130px;
                padding: 10px 18px;
                margin: 4px;
                border-radius: 12px;
                font-weight: 600;
            }
            QTabBar::tab:selected {
                background: #d97b66;
                color: white;
            }
            QLabel.sectionTitle {
                color: #7f3d3b;
                font-size: 16px;
                font-weight: 700;
            }
            QLabel.muted {
                color: #957774;
            }
            QPushButton {
                background: #d97b66;
                color: white;
                border: none;
                border-radius: 12px;
                padding: 10px 16px;
                font-weight: 700;
            }
            QPushButton:hover {
                background: #c96853;
            }
            QPushButton.secondary {
                background: #f3dfdb;
                color: #7a504d;
            }
            QPushButton.secondary:hover {
                background: #ecd0ca;
            }
            QLineEdit, QTextEdit, QComboBox, QDateEdit, QListWidget, QCalendarWidget {
                border: 1px solid #e5c9c4;
                border-radius: 12px;
                background: #fffefe;
                padding: 8px;
                color: #473130;
            }
            QListWidget::item {
                padding: 8px;
                margin: 3px 0;
                border-bottom: 1px solid #f3e3e0;
            }
            """
        )

        central = QWidget()
        root_layout = QVBoxLayout(central)
        root_layout.setContentsMargins(20, 20, 20, 20)
        root_layout.setSpacing(16)

        hero = QFrame()
        hero.setObjectName("heroCard")
        hero_layout = QVBoxLayout(hero)
        hero_layout.setContentsMargins(20, 20, 20, 20)

        title = QLabel("مساحتنا الخاصة")
        title.setObjectName("heroTitle")
        hero_layout.addWidget(title)

        subtitle = QLabel("رسائل وذكريات ومواعيد مشتركة بين جهازين إذا استخدمتما نفس مجلد البيانات.")
        subtitle.setObjectName("heroSubTitle")
        hero_layout.addWidget(subtitle)

        self.sync_status_label = QLabel()
        self.sync_status_label.setProperty("class", "muted")
        hero_layout.addWidget(self.sync_status_label)
        root_layout.addWidget(hero)

        self.tabs = QTabWidget()
        self.tabs.addTab(self.create_dashboard_tab(), "الرئيسية")
        self.tabs.addTab(self.create_messages_tab(), "الرسائل")
        self.tabs.addTab(self.create_files_tab(), "الملفات")
        self.tabs.addTab(self.create_calendar_tab(), "المواعيد")
        self.tabs.addTab(self.create_diary_tab(), "اليوميات")
        self.tabs.addTab(self.create_challenges_tab(), "التحديات")
        self.tabs.addTab(self.create_settings_tab(), "الإعدادات")
        root_layout.addWidget(self.tabs)

        self.setCentralWidget(central)

    def create_panel(self, title_text, subtitle_text=None):
        panel = QFrame()
        panel.setObjectName("panelCard")
        layout = QVBoxLayout(panel)
        layout.setContentsMargins(18, 18, 18, 18)
        layout.setSpacing(10)

        title = QLabel(title_text)
        title.setProperty("class", "sectionTitle")
        title.setFont(QFont("Segoe UI", 11, QFont.Bold))
        layout.addWidget(title)

        if subtitle_text:
            subtitle = QLabel(subtitle_text)
            subtitle.setWordWrap(True)
            subtitle.setProperty("class", "muted")
            layout.addWidget(subtitle)

        return panel, layout

    def create_dashboard_tab(self):
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setSpacing(14)

        panel, panel_layout = self.create_panel(
            "كيف تشغلونه على جهازين",
            "الفكرة الأبسط: اختارا مجلدًا مشتركًا عبر OneDrive أو Dropbox أو Google Drive Desktop، ثم اجعلا التطبيق في الجهازين يشير إلى نفس المجلد من تبويب الإعدادات.",
        )

        guide_lines = [
            "1. ثبّتا Python وPyQt5 على الجهازين.",
            "2. ضعا نسخة من البرنامج على كل جهاز.",
            "3. اختارا مجلدًا سحابيًا مشتركًا بينكما.",
            "4. من الإعدادات اختارا نفس مجلد البيانات في الجهازين.",
            "5. بعد ذلك ستظهر الرسائل والملفات والمواعيد لكما مع التحديث التلقائي.",
        ]
        for line in guide_lines:
            label = QLabel(line)
            label.setWordWrap(True)
            panel_layout.addWidget(label)

        layout.addWidget(panel)

        summary_panel, summary_layout = self.create_panel(
            "ملخص سريع",
            "هذه اللوحة تعطيكما حالة الاتصال الحالية ومكان حفظ البيانات."
        )
        self.dashboard_summary = QLabel()
        self.dashboard_summary.setWordWrap(True)
        summary_layout.addWidget(self.dashboard_summary)
        layout.addWidget(summary_panel)
        layout.addStretch()
        return widget

    def create_messages_tab(self):
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setSpacing(12)

        top_panel, top_layout = self.create_panel(
            "محادثتنا",
            "أي رسالة تكتب هنا تُحفظ في مجلد البيانات المشترك."
        )

        sender_layout = QHBoxLayout()
        sender_layout.addWidget(QLabel("المرسل"))
        self.sender_combo = QComboBox()
        sender_layout.addWidget(self.sender_combo)
        top_layout.addLayout(sender_layout)

        self.message_input = QTextEdit()
        self.message_input.setPlaceholderText("اكتب رسالة لطيفة هنا...")
        self.message_input.setMaximumHeight(120)
        top_layout.addWidget(self.message_input)

        send_btn = QPushButton("إرسال الرسالة")
        send_btn.clicked.connect(self.send_message)
        top_layout.addWidget(send_btn)
        layout.addWidget(top_panel)

        list_panel, list_layout = self.create_panel("آخر الرسائل")
        self.messages_list = QListWidget()
        list_layout.addWidget(self.messages_list)
        layout.addWidget(list_panel)
        return widget

    def create_files_tab(self):
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setSpacing(12)

        upload_panel, upload_layout = self.create_panel(
            "الملفات والصور",
            "عند رفع أي ملف يتم نسخه تلقائيًا إلى مجلد البيانات المشترك."
        )

        uploader_row = QHBoxLayout()
        uploader_row.addWidget(QLabel("رافع الملف"))
        self.uploader_combo = QComboBox()
        uploader_row.addWidget(self.uploader_combo)
        upload_layout.addLayout(uploader_row)

        upload_btn = QPushButton("رفع ملف أو صورة")
        upload_btn.clicked.connect(self.upload_file)
        upload_layout.addWidget(upload_btn)

        open_btn = QPushButton("فتح الملف المحدد")
        open_btn.setProperty("class", "secondary")
        open_btn.clicked.connect(self.open_selected_file)
        upload_layout.addWidget(open_btn)
        layout.addWidget(upload_panel)

        list_panel, list_layout = self.create_panel("الملفات المرفوعة")
        self.files_list = QListWidget()
        list_layout.addWidget(self.files_list)
        layout.addWidget(list_panel)
        return widget

    def create_calendar_tab(self):
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setSpacing(12)

        panel, panel_layout = self.create_panel(
            "المواعيد والذكريات",
            "استخدماها للمناسبات، مواعيد الاتصال، أو أي تاريخ مهم لكما."
        )
        self.calendar = QCalendarWidget()
        panel_layout.addWidget(self.calendar)

        self.event_title = QLineEdit()
        self.event_title.setPlaceholderText("عنوان الموعد أو المناسبة")
        panel_layout.addWidget(self.event_title)

        self.event_desc = QTextEdit()
        self.event_desc.setPlaceholderText("تفاصيل إضافية")
        self.event_desc.setMaximumHeight(90)
        panel_layout.addWidget(self.event_desc)

        self.event_date = QDateEdit()
        self.event_date.setCalendarPopup(True)
        self.event_date.setDate(QDate.currentDate())
        panel_layout.addWidget(self.event_date)

        add_event_btn = QPushButton("إضافة موعد")
        add_event_btn.clicked.connect(self.add_event)
        panel_layout.addWidget(add_event_btn)
        layout.addWidget(panel)

        list_panel, list_layout = self.create_panel("المواعيد القادمة")
        self.events_list = QListWidget()
        list_layout.addWidget(self.events_list)
        layout.addWidget(list_panel)
        return widget

    def create_diary_tab(self):
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setSpacing(12)

        panel, panel_layout = self.create_panel(
            "يومياتنا",
            "مكان بسيط للخواطر اليومية والرسائل الطويلة."
        )

        author_row = QHBoxLayout()
        author_row.addWidget(QLabel("الكاتب"))
        self.diary_author = QComboBox()
        author_row.addWidget(self.diary_author)
        panel_layout.addLayout(author_row)

        self.diary_input = QTextEdit()
        self.diary_input.setPlaceholderText("اكتب ما تريد تذكره لاحقًا...")
        panel_layout.addWidget(self.diary_input)

        save_btn = QPushButton("حفظ اليومية")
        save_btn.clicked.connect(self.save_diary)
        panel_layout.addWidget(save_btn)
        layout.addWidget(panel)

        list_panel, list_layout = self.create_panel("آخر اليوميات")
        self.diary_list = QListWidget()
        list_layout.addWidget(self.diary_list)
        layout.addWidget(list_panel)
        return widget

    def create_challenges_tab(self):
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setSpacing(12)

        panel, panel_layout = self.create_panel(
            "التحديات",
            "أضيفوا أفكارًا لطيفة مثل تحدي صورة، سؤال يومي، أو لعبة بسيطة."
        )

        self.challenge_title = QLineEdit()
        self.challenge_title.setPlaceholderText("اسم التحدي")
        panel_layout.addWidget(self.challenge_title)

        self.challenge_desc = QTextEdit()
        self.challenge_desc.setPlaceholderText("وصف التحدي")
        self.challenge_desc.setMaximumHeight(90)
        panel_layout.addWidget(self.challenge_desc)

        creator_row = QHBoxLayout()
        creator_row.addWidget(QLabel("صاحب التحدي"))
        self.challenge_creator = QComboBox()
        creator_row.addWidget(self.challenge_creator)
        panel_layout.addLayout(creator_row)

        add_btn = QPushButton("إضافة التحدي")
        add_btn.clicked.connect(self.add_challenge)
        panel_layout.addWidget(add_btn)
        layout.addWidget(panel)

        list_panel, list_layout = self.create_panel("التحديات الحالية")
        self.challenges_list = QListWidget()
        list_layout.addWidget(self.challenges_list)
        layout.addWidget(list_panel)
        return widget

    def create_settings_tab(self):
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setSpacing(12)

        panel, panel_layout = self.create_panel(
            "إعدادات المشاركة",
            "هنا تحدد أسماءكما ومكان البيانات. يجب أن يكون نفس مجلد البيانات مضبوطًا على الجهازين."
        )

        self.your_name_input = QLineEdit(self.settings.get("your_name", "أنا"))
        self.your_name_input.setPlaceholderText("اسمك")
        panel_layout.addWidget(self.your_name_input)

        self.partner_name_input = QLineEdit(self.settings.get("partner_name", "حبيبتي"))
        self.partner_name_input.setPlaceholderText("اسم الطرف الآخر")
        panel_layout.addWidget(self.partner_name_input)

        folder_row = QHBoxLayout()
        self.shared_folder_input = QLineEdit(self.settings.get("shared_folder", ""))
        self.shared_folder_input.setPlaceholderText("اختياري: حدّد مجلد بيانات مشترك")
        folder_row.addWidget(self.shared_folder_input)

        browse_btn = QPushButton("اختيار المجلد")
        browse_btn.setProperty("class", "secondary")
        browse_btn.clicked.connect(self.select_shared_folder)
        folder_row.addWidget(browse_btn)
        panel_layout.addLayout(folder_row)

        save_btn = QPushButton("حفظ الإعدادات")
        save_btn.clicked.connect(self.save_profile_settings)
        panel_layout.addWidget(save_btn)

        note = QLabel(
            "مهم: لو كان كل جهاز يستخدم مجلدًا مختلفًا فلن تتم المزامنة. "
            "يفضل أن يكون المجلد داخل OneDrive المشترك بينكما."
        )
        note.setWordWrap(True)
        note.setProperty("class", "muted")
        panel_layout.addWidget(note)
        layout.addWidget(panel)
        layout.addStretch()
        return widget

    def style_secondary_buttons(self):
        for button in self.findChildren(QPushButton):
            if button.property("class") == "secondary":
                button.setStyle(button.style())

    def start_auto_refresh(self):
        self.refresh_timer = QTimer(self)
        self.refresh_timer.timeout.connect(self.load_all_data)
        self.refresh_timer.start(3000)
        self.update_sync_status()

    def update_sync_status(self):
        shared_folder = self.settings.get("shared_folder", "").strip()
        if shared_folder:
            folder_text = f"مجلد البيانات الحالي: {shared_folder}"
        else:
            folder_text = f"مجلد البيانات المحلي: {self.data_dir}"
        self.sync_status_label.setText(folder_text)
        self.dashboard_summary.setText(
            f"الأسماء الحالية: {self.people_options()[0]} و {self.people_options()[1]}\n"
            f"{folder_text}\n"
            "التطبيق يحدث البيانات تلقائيًا كل 3 ثوانٍ تقريبًا."
        )

    def select_shared_folder(self):
        folder = QFileDialog.getExistingDirectory(self, "اختر مجلد البيانات المشترك")
        if folder:
            self.shared_folder_input.setText(folder)

    def save_profile_settings(self):
        your_name = self.your_name_input.text().strip() or "أنا"
        partner_name = self.partner_name_input.text().strip() or "حبيبتي"
        shared_folder = self.shared_folder_input.text().strip()

        old_db_path = self.db_path
        old_files_dir = self.files_dir

        self.settings["your_name"] = your_name
        self.settings["partner_name"] = partner_name
        self.settings["shared_folder"] = shared_folder
        self.save_settings_file()

        self.data_dir = self.resolve_data_dir()
        self.files_dir = self.data_dir / "files"
        self.db_path = self.data_dir / "couple_data.db"
        self.ensure_storage()

        if not self.db_path.exists() and old_db_path.exists():
            shutil.copy2(old_db_path, self.db_path)
            if old_files_dir.exists():
                for source in old_files_dir.iterdir():
                    target = self.files_dir / source.name
                    if source.is_file() and not target.exists():
                        shutil.copy2(source, target)

        self.init_database()
        self.refresh_people_combos()
        self.load_all_data()
        self.update_sync_status()
        QMessageBox.information(self, "تم الحفظ", "تم حفظ الإعدادات وتحديث المجلد المشترك.")

    def refresh_people_combos(self):
        combos = [
            getattr(self, "sender_combo", None),
            getattr(self, "uploader_combo", None),
            getattr(self, "diary_author", None),
            getattr(self, "challenge_creator", None),
        ]
        people = self.people_options()

        for combo in combos:
            if combo is None:
                continue
            current = combo.currentText()
            combo.blockSignals(True)
            combo.clear()
            combo.addItems(people)
            if current in people:
                combo.setCurrentText(current)
            combo.blockSignals(False)

    def connect_db(self):
        return sqlite3.connect(self.db_path)

    def send_message(self):
        sender = self.sender_combo.currentText()
        message = self.message_input.toPlainText().strip()
        if not message:
            QMessageBox.warning(self, "تنبيه", "اكتب رسالة أولًا.")
            return

        conn = self.connect_db()
        c = conn.cursor()
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        c.execute(
            "INSERT INTO messages (sender, message, timestamp) VALUES (?, ?, ?)",
            (sender, message, timestamp),
        )
        conn.commit()
        conn.close()

        self.message_input.clear()
        self.load_messages()

    def load_messages(self):
        self.messages_list.clear()
        conn = self.connect_db()
        c = conn.cursor()
        c.execute("SELECT sender, message, timestamp FROM messages ORDER BY id DESC")
        for sender, message, timestamp in c.fetchall():
            item = QListWidgetItem(f"{sender}\n{message}\n{timestamp}")
            self.messages_list.addItem(item)
        conn.close()

    def upload_file(self):
        file_path, _ = QFileDialog.getOpenFileName(
            self,
            "اختر ملفًا",
            "",
            "All Files (*);;Images (*.jpg *.png *.jpeg *.gif);;Documents (*.pdf *.doc *.docx *.txt)",
        )
        if not file_path:
            return

        uploader = self.uploader_combo.currentText()
        source_path = Path(file_path)
        destination = self.files_dir / source_path.name
        shutil.copy2(source_path, destination)

        conn = self.connect_db()
        c = conn.cursor()
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        c.execute(
            "INSERT INTO files (file_name, file_path, uploaded_by, timestamp) VALUES (?, ?, ?, ?)",
            (source_path.name, str(destination), uploader, timestamp),
        )
        conn.commit()
        conn.close()

        self.load_files()
        QMessageBox.information(self, "تم", "تم رفع الملف إلى المساحة المشتركة.")

    def load_files(self):
        self.files_list.clear()
        conn = self.connect_db()
        c = conn.cursor()
        c.execute("SELECT file_name, uploaded_by, timestamp, file_path FROM files ORDER BY id DESC")
        for file_name, uploader, timestamp, file_path in c.fetchall():
            item = QListWidgetItem(f"{file_name}\nبواسطة: {uploader}\n{timestamp}")
            item.setData(Qt.UserRole, file_path)
            self.files_list.addItem(item)
        conn.close()

    def open_selected_file(self):
        item = self.files_list.currentItem()
        if item is None:
            QMessageBox.warning(self, "تنبيه", "اختر ملفًا من القائمة أولًا.")
            return

        file_path = item.data(Qt.UserRole)
        if not file_path or not Path(file_path).exists():
            QMessageBox.warning(self, "خطأ", "الملف غير موجود في المسار المحفوظ.")
            return

        os.startfile(file_path)

    def add_event(self):
        title = self.event_title.text().strip()
        description = self.event_desc.toPlainText().strip()
        date = self.event_date.date().toString("yyyy-MM-dd")
        if not title:
            QMessageBox.warning(self, "تنبيه", "اكتب عنوان الموعد.")
            return

        conn = self.connect_db()
        c = conn.cursor()
        c.execute(
            "INSERT INTO events (title, description, date, created_by) VALUES (?, ?, ?, ?)",
            (title, description, date, self.sender_combo.currentText()),
        )
        conn.commit()
        conn.close()

        self.event_title.clear()
        self.event_desc.clear()
        self.load_events()

    def load_events(self):
        self.events_list.clear()
        conn = self.connect_db()
        c = conn.cursor()
        c.execute("SELECT title, description, date, created_by FROM events ORDER BY date ASC")
        for title, description, date, created_by in c.fetchall():
            text = f"{title}\n{date}\nأضيف بواسطة: {created_by}"
            if description:
                text += f"\n{description}"
            self.events_list.addItem(QListWidgetItem(text))
        conn.close()

    def save_diary(self):
        content = self.diary_input.toPlainText().strip()
        author = self.diary_author.currentText()
        if not content:
            QMessageBox.warning(self, "تنبيه", "اكتب شيئًا قبل الحفظ.")
            return

        conn = self.connect_db()
        c = conn.cursor()
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        c.execute(
            "INSERT INTO diary (author, content, date) VALUES (?, ?, ?)",
            (author, content, timestamp),
        )
        conn.commit()
        conn.close()

        self.diary_input.clear()
        self.load_diary()

    def load_diary(self):
        self.diary_list.clear()
        conn = self.connect_db()
        c = conn.cursor()
        c.execute("SELECT author, content, date FROM diary ORDER BY id DESC")
        for author, content, date in c.fetchall():
            preview = content if len(content) <= 140 else content[:140] + "..."
            self.diary_list.addItem(QListWidgetItem(f"{author}\n{date}\n{preview}"))
        conn.close()

    def add_challenge(self):
        title = self.challenge_title.text().strip()
        description = self.challenge_desc.toPlainText().strip()
        creator = self.challenge_creator.currentText()
        if not title:
            QMessageBox.warning(self, "تنبيه", "اكتب اسم التحدي.")
            return

        conn = self.connect_db()
        c = conn.cursor()
        c.execute(
            "INSERT INTO challenges (title, description, creator, date) VALUES (?, ?, ?, ?)",
            (title, description, creator, datetime.now().strftime("%Y-%m-%d")),
        )
        conn.commit()
        conn.close()

        self.challenge_title.clear()
        self.challenge_desc.clear()
        self.load_challenges()

    def load_challenges(self):
        self.challenges_list.clear()
        conn = self.connect_db()
        c = conn.cursor()
        c.execute(
            """
            SELECT title, description, creator, date
            FROM challenges
            WHERE completed_by IS NULL
            ORDER BY id DESC
            """
        )
        for title, description, creator, date in c.fetchall():
            text = f"{title}\nصاحب التحدي: {creator}\n{date}"
            if description:
                text += f"\n{description}"
            self.challenges_list.addItem(QListWidgetItem(text))
        conn.close()

    def load_all_data(self):
        self.refresh_people_combos()
        if hasattr(self, "messages_list"):
            self.load_messages()
        if hasattr(self, "files_list"):
            self.load_files()
        if hasattr(self, "events_list"):
            self.load_events()
        if hasattr(self, "diary_list"):
            self.load_diary()
        if hasattr(self, "challenges_list"):
            self.load_challenges()
        self.update_sync_status()


if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = CoupleApp()
    window.show()
    sys.exit(app.exec_())
