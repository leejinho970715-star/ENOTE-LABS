"""Generate public product guides and matching code-drawn identity/social assets.
Run with the bundled Python (reportlab, pypdfium2, fonttools, brotli).
Screens are fictional-sample screenshots captured from the actual static apps.
"""
from pathlib import Path
import shutil, io, json, sys
from xml.sax.saxutils import escape
from PIL import Image
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont as RLFont
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, Color, white
from reportlab.lib.utils import ImageReader
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT
import pypdfium2 as pdfium
from pypdf import PdfReader

ROOT=Path(__file__).resolve().parents[1]
TMP=ROOT/'tmp/pdfs'; OUT=ROOT/'output/pdf'; SHOTS=ROOT/'docs/product-screens'
PUBLIC=ROOT/'agencyflow/public'; TMP.mkdir(parents=True,exist_ok=True); OUT.mkdir(parents=True,exist_ok=True)
for weight,name in [(400,'Pretendard'),(700,'PretendardBold')]:
    target=TMP/(name+'.ttf')
    if not target.exists():
        from fontTools.ttLib import TTFont
        from fontTools.varLib.instancer import instantiateVariableFont
        font=TTFont(ROOT/'demos/weekly-report/assets/PretendardVariable.woff2')
        font=instantiateVariableFont(font,{'wght':weight},inplace=True)
        font.flavor=None; font.save(target)
    pdfmetrics.registerFont(RLFont(name,str(target)))

INK=HexColor('#382c24'); MUTED=HexColor('#806e62'); GREEN=HexColor('#c4541b'); LINE=HexColor('#ecded3'); BG=HexColor('#fbf7f3')
W,H=595.28,841.89
STYLE=ParagraphStyle('body',fontName='Pretendard',fontSize=13,leading=22,textColor=INK,wordWrap='CJK',spaceAfter=12)

products={
'flownote':dict(name='Flownote',ko='플로노트',tag='보고 자동화 · 고객 프로젝트 운영',summary='매번 정리하는 자료를 고객과 프로젝트별로 확인하고, 보고할 내용을 명확하게 만드세요.',url='https://flow-note-psi.vercel.app/workspace/',steps=['공개 체험에서 가상 고객·보고 흐름을 살펴봅니다.','CSV 직접 체험에서 내 양식을 검사하고 집계·출력합니다.','실제 저장·검수·승인이 필요하면 로컬 운영판 도입 범위를 상담합니다.'],screens=[
 ('dash','전체 업무','진행 현황을 한눈에 확인합니다.',['프로젝트, 검수 대기, 승인 상태를 구분해 확인하세요.','빠른 시작에서 필요한 업무로 이동합니다.','공개 화면의 수치와 승인 상태는 가상 샘플입니다.']),
 ('projects','고객 · 프로젝트','보고 자료가 연결될 고객과 업무를 확인합니다.',['고객과 프로젝트, 캠페인 연결 관계를 살펴보세요.','로컬 운영판에서는 담당자·기간·캠페인 매핑을 설정합니다.','공개 체험에서는 실제 고객 정보를 저장하지 않습니다.']),
 ('csv','CSV 직접 체험','원본과 제외 내역을 확인한 뒤 고객별 파일을 출력합니다.',['샘플 CSV를 내려받아 열 구조를 확인합니다. 최대 2MB·15,000행·고객 3곳의 같은 양식을 사용합니다.','고객과 보고 시작일을 선택하고 검수 내역·누락·중복·제외 행을 확인하세요.','제외 내역 확인 후 집계 CSV 또는 고객용 HTML 보고서를 다운로드합니다. HTML은 브라우저 인쇄로 PDF 저장할 수 있습니다.']),
 ('reports','보고서 보관함','검수할 보고서와 승인된 버전을 구분합니다.',['상태와 고객·기간을 확인하고 보고서를 선택하세요.','다운로드한 샘플은 실제 고객 실적이 아닙니다.','로컬 운영판은 작성자와 다른 담당자의 검수·승인 흐름을 제공합니다.']),
 ('team','팀 · 권한','작성자와 검수자의 역할을 나눕니다.',['공개 화면은 가상 팀의 역할 예시입니다.','실제 계정·권한 검사는 로컬 운영판에서 동작합니다.','작성자가 자신이 만든 보고서를 승인하지 않는 것이 기본 원칙입니다.']),
 ('audit','변경 기록','어떤 버전과 상태를 확인했는지 살펴봅니다.',['공개 화면은 가상 변경 이력입니다.','로컬 운영판에서 버전·검수 이력을 확인합니다.','수동 전달 기록과 고객의 실제 수신 확인은 다릅니다.'])],limits=['공개 대시보드는 가상 자료 조회용입니다. 브라우저 CSV 체험과 로컬 저장 운영판은 제공 범위가 다릅니다.','클라우드 계정 화면은 기초자료 등록 단계이며, 클라우드 보고서 업무 전체 연결은 준비 중입니다.','외부 광고 계정 자동 수집·이메일 자동 발송·클라우드 구독 결제를 기본 기능으로 제공하지 않습니다.']),
'agencyflow':dict(name='ProjectFlow',ko='ProjectFlow',tag='프로젝트 · 일정 · 작업 · 자료 검토',summary='다양한 업종의 담당자·기한·단계와 작업 진행률을 관리하고, 필요한 결과물을 함께 검토하세요.',url='https://agencyflow-studio-dun.vercel.app/workspace/',steps=['가상 프로젝트를 선택하고 시안 피드백 메뉴를 엽니다.','이미지 위치를 선택해 핀과 의견을 남깁니다.','담당자가 처리한 뒤 고객이 올바른 버전을 확인하고 승인합니다.'],screens=[
 ('dash','전체 흐름','먼저 확인해야 할 프로젝트와 요청을 찾습니다.',['진행 중 프로젝트와 미완료 피드백을 확인하세요.','프로젝트 종료 예정일은 다른 세부 일정과 구분됩니다.','미수금·MRR은 결제·수금 연결 전까지 계산하지 않습니다.']),
 ('projects','프로젝트','고객·담당자·기간과 진행 단계를 연결합니다.',['프로젝트를 만들 때 고객과 담당자·기간을 확인하세요.','상담부터 검수·완료까지 단계를 바꿔 진행 상태를 공유합니다.','회사의 고객은 배정된 프로젝트만 조회하는 권한 구조입니다.']),
 ('clients','고객 관리','프로젝트의 고객과 연락 정보를 정리합니다.',['고객 등록·수정 후 프로젝트와 연결하세요.','불필요한 실제 개인정보는 샘플 체험에 입력하지 마세요.','고객 보관과 계정 접근 권한 회수는 같은 기능이 아닙니다.']),
 ('feedback','시안 피드백','수정 위치와 의견을 같은 화면에 남깁니다.',['PNG·JPEG·WebP 시안을 업로드합니다. 파일당 최대 5MB입니다.','이미지를 눌러 핀과 의견을 남기고 답글·처리 상태를 확인합니다.','새 시안은 새 버전으로 등록합니다. 고객 승인은 해당 버전에 남습니다.']),
 ('quotes','견적서','수량·단가와 견적 버전을 확인합니다.',['페이지·난이도·선택 기능은 견적 입력을 돕는 기준입니다.','회사 모드에서는 서버가 금액을 다시 계산합니다.','고객 공개·승인과 브라우저 인쇄/PDF 저장을 제공합니다. 계약 전자서명과는 다릅니다.']),
 ('tasks','작업 목록','담당자와 해야 할 일을 정리합니다.',['필요한 작업을 등록하고 상태를 확인하세요.','상태는 실제 작업자가 완료 여부를 확인한 뒤 바꿉니다.','외부 서비스를 대신 실행하거나 자동 납품하는 기능은 아닙니다.']),
 ('team','팀 · 요금','역할과 체험 조건을 확인합니다.',['회사 모드는 이메일 확인을 마친 계정의 연결이 필요합니다.','현재 초대 메일은 자동 발송하지 않습니다. 일반 고객 메일 서비스도 준비 중입니다.','체험 종료 후에는 읽기 전용이 됩니다. 결제 버튼은 준비 중으로 표시됩니다.'])],limits=['샘플은 이 브라우저에만 저장됩니다. 회사 모드는 실제 회사 권한과 DB를 사용하며, 일반 고객 가입·초대 전체 흐름은 추가 검증이 필요합니다.','이미지 시안 검수 중심입니다. 임의 웹사이트 URL 자동 검수·계약 전자서명·자동 청구는 제공하지 않습니다.','구독 결제·메일 알림·권한 회수와 운영 복구 등의 상용 운영 보완이 남아 있습니다.']),
'follonote':dict(name='Follonote',ko='Follonote',tag='고객 정보 · 상담 기록 · 영업 진행 관리',summary='고객과 나눈 이야기부터 다음 연락까지, 영업 담당자의 다음 행동을 분명하게 만드세요.',url='https://flownote-studio.vercel.app/follonote/workspace/',steps=['고객 관리에서 고객과 담당자 정보를 등록합니다.','영업기회에 금액·목표일·현재 단계를 입력합니다.','상담 기록을 남기고 다음 연락 날짜를 확인합니다.'],screens=[
 ('dash','영업 현황','진행 중인 기회와 오늘의 연락을 확인합니다.',['등록 고객 수와 진행 중인 기회를 확인하세요.','입력 기회 금액은 확정 매출·수금·이익이나 예측 매출이 아닙니다.','오늘 연락할 내용을 살펴보고 실제 연락 후 완료 표시합니다.']),
 ('contacts','고객 관리','고객별 맥락을 기록합니다.',['고객 회사를 선택하면 담당자·연락처·유입 경로와 메모를 확인합니다.','정보 수정으로 연락 정보를 고치고 상담 기록을 추가하세요.','진행 중인 기회가 있으면 고객 보관이 제한됩니다.']),
 ('deals','영업 파이프라인','기회의 현재 단계를 구분합니다.',['고객과 연결한 영업기회를 만들고 입력 금액·목표일을 정하세요.','신규·상담·제안·협상·수주·종료 단계를 직접 변경합니다.','수주 표시는 영업 상태 기록이며 자동 결제나 입금 확인이 아닙니다.']),
 ('followups','후속 연락','다음에 할 연락을 놓치지 않도록 기록합니다.',['고객과 연락할 내용·날짜를 등록하세요.','연락이 끝난 뒤 완료 버튼을 누릅니다.','이메일·문자 알림은 자동 발송하지 않으며 일정 수정·취소는 보완 예정입니다.'])],limits=['브라우저 체험과 회사 공유 모드를 구분합니다. 샘플 담당자 전환은 권한 흐름 시연입니다.','회사·팀 권한과 체험 기간은 ProjectFlow 기반 회사 공간을 함께 사용합니다. 제품별 독립 체험이 아닙니다.','등록 한도·권한 회수·대량 조회·반출·후속 연락 수정 등 상용 운영 보완이 남아 있습니다.']),
'crewmemo':dict(name='Crewmemo',ko='Crewmemo',tag='팀 공지 · 공유 일정 · 내부 결재 · 담당 업무',summary='메신저에 묻힌 소식과 구두로 끝난 결정을 팀이 함께 확인할 수 있는 기록으로 남기세요.',url='https://flownote-studio.vercel.app/crewmemo/workspace/',steps=['오늘의 팀에서 공지·일정·내 업무를 확인합니다.','일정이나 담당 업무를 등록하고 상태를 공유합니다.','결재 요청은 다른 팀원을 지정해 검토·승인 또는 반려를 받습니다.'],screens=[
 ('dash','오늘의 팀','팀과 나에게 필요한 내용을 확인합니다.',['오늘 일정, 내 결재 대기, 미완료 업무를 살펴보세요.','팀 공지와 다가오는 일정은 등록 자료를 기준으로 표시됩니다.','샘플 담당자 전환은 실제 사용자를 초대하는 기능이 아닙니다.']),
 ('notices','공지 게시판','팀이 알아야 할 소식을 기록합니다.',['공지 작성에서 제목과 내용을 입력하세요.','관리자는 공지를 상단에 고정할 수 있습니다.','작성자 또는 관리자가 공지를 보관할 수 있습니다.']),
 ('calendar','팀 일정','회의와 공유 일정을 한곳에서 확인합니다.',['시작·종료 시각과 장소를 입력합니다.','종료 시각은 시작 시각 이후여야 합니다.','일정 내용 수정·취소와 외부 캘린더 동기화는 제공 범위에 포함되지 않습니다.']),
 ('approvals','내부 결재','서로 다른 사람이 요청과 검토를 맡습니다.',['작성자가 다른 내부 팀원을 결재자로 지정합니다.','지정 결재자만 대기 문서를 승인·반려할 수 있습니다.','처리된 문서를 다시 승인할 수 없습니다. 실제 지급이나 계약 전자서명은 실행하지 않습니다.']),
 ('tasks','팀 업무','담당자와 마감일을 명확히 합니다.',['업무 제목·담당자·기한·우선순위를 등록합니다.','대기·진행중·완료 상태를 직접 변경합니다.','업무 내용·담당자·기한 수정과 취소는 보완 예정입니다.'])],limits=['공지·일정·내부 결재·업무 공유에 집중하는 초기 검증판입니다. 급여·근태·회계·사내 메신저를 포함한 종합 그룹웨어는 아닙니다.','다른 결재자가 필요하므로 내부 구성원 2명 이상이 필요합니다. 공통 Lite 1좌석 정책과의 상품 조정이 남아 있습니다.','회사 모드는 공통 회사·체험 권한을 사용합니다. 가입 메일·결제·권한 회수·복구 등의 운영 보완이 남아 있습니다.'])}


selected_products = [sys.argv[sys.argv.index('--product')+1]] if '--product' in sys.argv else list(products)
if any(k not in products for k in selected_products): raise ValueError('Unknown product')
products['agencyflow'].update(steps=['고객 또는 내부 요청 부서를 등록하고 프로젝트의 담당자·기간·단계를 정합니다.','프로젝트 개요에서 작업을 추가하고 상태·우선순위·기한을 관리합니다.','진척과 기한 초과를 확인하고 필요한 자료만 검토·승인합니다.'],screens=[
 ('dash','전체 흐름','여러 프로젝트의 진행 상황을 확인합니다.',['진행 중·완료·운영 프로젝트와 기한 초과 작업을 확인합니다.','프로젝트 제목을 눌러 개요로 이동합니다.','수치는 실제 매출이나 공수 예측이 아니라 등록된 자료의 집계입니다.']),
 ('projects','프로젝트 보드','업종에 관계없이 단계를 관리합니다.',['프로젝트명 또는 담당자 이름으로 검색합니다.','접수·계획·승인·준비·실행·검토·완료·운영 단계로 표시합니다.','변경 내용은 샘플에서는 브라우저, 회사 모드에서는 기존 회사 권한에 따라 저장됩니다.']),
 ('overview','프로젝트 개요','담당자·일정·진척을 한곳에 모았습니다.',['등록 작업의 완료 비율을 확인합니다. 작업이 없으면 미측정으로 표시합니다.','기한을 넘긴 미완료 작업과 프로젝트 일정을 확인합니다.','작업 완료율이 고객 승인이나 실제 납품 완료를 뜻하지 않습니다.']),
]+products['agencyflow']['screens'][2:],limits=['샘플은 이 브라우저에만 저장됩니다. 회사 모드는 기존 회사 권한과 DB 명령을 사용하며 이번 PMS 확장 동선의 실제 회사 계정 HTTP 검증은 수행하지 않았습니다.','프로젝트·작업·단계·기한·진척·자료 검토를 지원하는 1차 확장판입니다. 간트 차트·작업 의존관계·공수·반복 일정 자동화는 제공하지 않습니다.','결제·일반 고객 메일·전자서명·임의 웹사이트 자동 검수는 준비 중입니다.'])
products['agencyflow']['screens']=[(v,t,d,['작업 범위에서 선택 프로젝트 또는 전체 프로젝트를 고릅니다.','프로젝트·담당자·마감일·우선순위를 등록하고 상태를 변경합니다.','완료 처리하면 해당 프로젝트의 작업 완료율에 반영됩니다.']) if v=='tasks' else (v,t,d,steps) for v,t,d,steps in products['agencyflow']['screens']]

# Chart chapters use unmodified captures of the implemented dashboards.
chart_chapters={
 'flownote':[
 ('charts','보고 상태 · 프로젝트 기간','최신 보고서와 기간별 업무 현황을 구분합니다.',['보고 상태는 프로젝트·보고 기간별 최신 버전만 집계합니다. 수치표 보기에서 정확한 건수를 확인하세요.','프로젝트 기간은 한국 날짜와 등록 시작·종료일 기준입니다. 기간 종료가 납품 완료를 뜻하지 않습니다.','등록 자료가 없으면 미집계로 표시합니다. 수동 전달 기록과 고객 수신 확인은 다릅니다.']),
 ('chart-projects','고객 · 담당자별 프로젝트','업무가 어디에 배분되어 있는지 살펴봅니다.',['고객·프로젝트 메뉴에서 현재 회사의 등록 프로젝트를 고객과 담당자별로 확인합니다.','담당자 미입력은 미지정으로 집계합니다. 실제 근무 시간이나 공수 평가는 아닙니다.','분류가 많으면 도표는 그 외 항목으로 묶고 수치표는 전체 분류를 제공합니다.']),
 ('chart-reports','보고서 버전별 집계','조회 범위를 바꾸면 집계도 함께 달라집니다.',['보관함의 기본 도표는 프로젝트·기간별 최신 보고서 기준입니다.','이전 버전도 보기를 선택하면 과거 버전을 포함한 상태와 프로젝트별 보고서 수를 집계합니다.','보고 건수는 고객 수·매출과 다릅니다. 공개 체험의 자료는 가상 예시입니다.'])],
 'agencyflow':[
 ('charts','프로젝트 단계 · 일정 도표','프로젝트의 분포와 마감 위험을 확인합니다.',['전체 흐름에서 현재 접근 가능한 활성 프로젝트의 단계를 비교합니다.','일정은 한국 날짜·종료 예정일 기준입니다. 완료·운영 단계는 종료로 분류합니다.','프로젝트 보드의 도표는 검색 결과와 같은 범위로 바뀝니다.']),
 ('charts-work','작업 · 고객 피드백 도표','완료로 기록한 작업과 검토 요청을 구분합니다.',['작업 도넛은 등록 작업 상태의 건수를 보여줍니다. 작업 완료율은 납품 승인과 다릅니다.','고객 피드백 도표는 접근 가능한 프로젝트의 모든 자료 버전을 집계합니다. 자료 검토 화면에서는 선택 버전만 집계합니다.','고객 역할에는 내부 작업 도표를 표시하지 않습니다. 견적 화면의 버전별 총액은 VAT 포함 입력 견적이며 매출 합계가 아닙니다.']),
 ('chart-tasks','작업 범위 · 마감 도표','선택 프로젝트와 전체 프로젝트를 전환합니다.',['작업 범위를 바꾸면 상태·마감 도표와 아래 작업 보드가 같은 범위로 바뀝니다.','기한 초과·오늘·7일 이내·8일 이후·날짜 미정·완료를 나눠 봅니다.','상태를 변경하면 도표도 갱신됩니다. 등록 작업이 없으면 진행률은 미측정입니다.'])],
 'follonote':[
 ('charts','영업 단계 · 입력 금액 도표','진행 중인 기회와 규모를 살펴봅니다.',['영업 현황과 파이프라인에서 현재 회사의 보관하지 않은 영업기회를 단계별로 비교합니다.','금액 도표는 사용자가 입력한 기회 금액입니다. 확정 매출·수금·이익·매출 예측으로 해석하지 마세요.','미입력·형식 오류 금액은 합계에서 제외하고 별도 안내합니다. 고객 관리에서는 유입 경로의 등록 건수를 확인합니다.']),
 ('chart-schedule','후속 연락 · 일정 도표','다음 연락과 처리 기록을 함께 확인합니다.',['등록 연락의 예정·완료 건수를 도넛으로 확인합니다. 연락 완료는 담당자가 직접 기록합니다.','마감 분포는 한국 날짜 기준이며 지난 날짜의 완료 연락은 기한 초과로 세지 않습니다.','도표의 수치표 보기를 열면 모든 분류의 정확한 숫자를 읽을 수 있습니다.'])],
 'crewmemo':[
 ('charts','팀 업무 · 내부 결재 도표','실행 상태와 결재 상태를 따로 읽습니다.',['팀 업무 도넛은 현재 회사의 대기·진행중·완료 등록 건수입니다. 근무 시간·근태 집계가 아닙니다.','결재 도표는 조회 가능한 문서의 대기·승인·반려·취소 건수를 보여줍니다.','승인된 문서도 실제 지급이나 계약 전자서명을 자동 실행하지 않습니다.']),
 ('chart-schedule','향후 7일 일정 도표','어느 날 일정이 몰려 있는지 확인합니다.',['오늘 포함 7일의 등록 일정 수를 시작일 기준으로 비교합니다. 한국 시간을 사용합니다.','일정이 없는 날의 0개와 조회할 등록 자료가 없는 상태를 구분합니다. 참석 여부를 추정하지 않습니다.','좁은 화면에서는 일정 도표 내부를 좌우로 움직일 수 있습니다.']),
 ('chart-tasks','팀 업무 · 마감 분포','먼저 처리할 업무를 찾습니다.',['업무 메뉴에서 처리 상태와 기한 분포를 함께 확인합니다.','기한이 지난 미완료 업무와 완료 업무를 구분합니다. 담당자가 상태를 변경하면 도표에 반영됩니다.','ProjectFlow와 연결한 작업은 회사 모드에서 상태를 양쪽에 반영합니다. 제목·담당자·기한은 자동 덮어쓰지 않습니다.'])]}
for key,chapters in chart_chapters.items():
 products[key]['screens']+=chapters
 products[key]['screens'].append(('suite','4개 제품 연결','영업에서 보고까지 같은 자료를 재사용합니다.',['제품 연결에서 공통 회사를 선택하고 CRM 고객과 프로젝트 고객을 연결합니다. 수주한 기회는 프로젝트로 생성할 수 있습니다.','프로젝트 작업은 내부 담당자를 지정해 Crewmemo로 연결합니다. Flownote는 양쪽 대표 관리자 확인 후 회사·CSV 고객·보고 프로젝트 순으로 연결합니다.','회사 모드의 연결 작업은 이력에 기록하며 중복 생성하지 않습니다. 고객 전체를 자동 병합하지 않고, Flownote 자료는 기존 회사 권한으로만 조회합니다.']))
 products[key]['limits']=['구현된 기능은 월 구독료와 체험 만료 없이 무료입니다. 역할·등록량·파일 검증 등의 운영 제한은 유지합니다.','회사 공유는 이메일 확인 계정과 해당 회사 권한이 필요합니다. 일반 고객 가입 메일 서비스, 자동 결제·자동 발송 등 미연동 기능은 제공하지 않습니다.','기존 데모 기반의 작은 맞춤 제작은 KRW 200,000~500,000, 부가세 별도입니다. 신규 대규모 개발·호스팅·외부 서비스·유지관리는 별도 협의합니다.']
products['flownote']['limits'].insert(0,'공개 대시보드는 가상 자료 조회용이며 CSV 검사는 브라우저에서 가능합니다. 보고서 작성·검수·승인 전체 화면은 로컬 운영판 범위입니다. 클라우드는 고객·프로젝트 등록과 연결 기반까지 제공합니다.')
products['agencyflow']['limits'].insert(0,'회사 운영 한도는 활성 프로젝트 100개·내부 구성원 10명·시안 총 1GB·파일당 5MB입니다. 간트·작업 의존관계·공수·임의 웹사이트 자동 검수는 포함하지 않습니다.')
products['agencyflow']['screens']=[(v,'팀 · 무료 이용' if v=='team' else t,d,['기존 가입·이메일 확인 계정을 관리자가 회사에 연결합니다. 고객은 지정 프로젝트만 조회합니다.','구현된 기능은 무료입니다. 활성 프로젝트 100개·내부 10명·시안 총 1GB·파일당 5MB의 운영 한도를 확인하세요.','팀원 접근 권한은 제품 연결과 별도로 확인합니다. 초대 메일은 자동 발송하지 않습니다.'] if v=='team' else steps) for v,t,d,steps in products['agencyflow']['screens']]

def para(c,text,x,y,width=515,size=13,color=INK,bold=False):
    st=ParagraphStyle('p',parent=STYLE,fontName='PretendardBold' if bold else 'Pretendard',fontSize=size,leading=size*1.65,textColor=color)
    p=Paragraph(escape(text),st); _,height=p.wrap(width,1000);p.drawOn(c,x,y-height);return y-height-12

def logo(c,kind,x,y,size=36):
    if kind=='enote' and (ROOT/'studio/assets/enote-labs-logo-20261031.png').exists():
        c.drawImage(ImageReader(str(ROOT/'studio/assets/enote-labs-logo-20261031.png')),x,y,width=size,height=size,mask='auto');return
    c.saveState();c.translate(x,y);c.scale(size/64,size/64)
    c.setFillColor(HexColor('#ed7834') if kind=='enote' else GREEN);c.roundRect(2,2,60,60,17,fill=1,stroke=0)
    c.setStrokeColor(white);c.setLineWidth(3.5);c.setLineCap(1);c.setLineJoin(1)
    def line(points):
        p=c.beginPath();p.moveTo(*points[0]);[p.lineTo(*pt) for pt in points[1:]];c.drawPath(p)
    if kind=='flownote':line([(20,15),(20,49),(41,49),(48,42),(48,15),(20,15)]);line([(27,35),(41,35)]);line([(27,27),(37,27)])
    elif kind=='agencyflow':line([(18,47),(47,47),(47,22),(33,22),(21,13),(21,22),(18,22),(18,47)]);line([(27,38),(39,38)]);line([(27,31),(34,31)])
    elif kind=='follonote':line([(18,46),(18,17),(48,17)]);line([(24,25),(33,35),(40,31),(48,45)]);line([(39,45),(48,45),(48,36)])
    elif kind=='crewmemo':
        for xx,yy,rr in [(32,42,6),(19,35,4),(45,35,4)]:c.circle(xx,yy,rr,fill=0,stroke=1)
        line([(15,19),(15,25),(23,29),(32,26),(41,29),(49,25),(49,19)]);line([(24,17),(24,25),(40,25),(40,17)])
    else:line([(19,48),(47,48)]);line([(19,48),(19,15),(47,15)]);line([(19,32),(40,32)]);line([(39,40),(47,32),(39,24)])
    c.restoreState()

def shell(c,p,page,section):
    c.setFillColor(white);c.rect(0,0,W,H,fill=1,stroke=0);logo(c,p,40,H-66,30)
    c.setFillColor(INK);c.setFont('PretendardBold',12);c.drawString(82,H-47,products[p]['name'])
    c.setFillColor(MUTED);c.setFont('Pretendard',9);c.drawRightString(W-40,H-47,'ENOTE-LABS | 제품 소개 · 사용 가이드')
    c.setStrokeColor(LINE);c.line(40,43,W-40,43);c.setFont('Pretendard',9);c.drawString(40,27,'2026.11.01 · 무료 체험 · 맞춤 제작 · 가상 자료 화면');c.drawRightString(W-40,27,f'{page:02d}')
    c.bookmarkPage('page'+str(page));c.addOutlineEntry(section,'page'+str(page),level=0,closed=False)

for key in selected_products:
    p=products[key]
    path=OUT/(key+'-guide.pdf');c=canvas.Canvas(str(path),pagesize=(W,H));c.setTitle(p['name']+' 제품소개 및 사용 매뉴얼 | ENOTE-LABS');c.setAuthor('ENOTE-LABS (이노트랩스)')
    page=1;shell(c,key,page,'제품 소개');y=H-116;y=para(c,p['name'],40,y,size=35,bold=True);y=para(c,p['ko']+' | '+p['tag'],40,y,size=15,color=GREEN);y=para(c,p['summary'],40,y-10,size=19,bold=True)
    c.drawImage(str(SHOTS/(key+'-dash.jpg')),40,194,width=515,height=326,preserveAspectRatio=True,anchor='c',mask='auto')
    para(c,'실제 프로그램의 가상 샘플 화면입니다. 고객 실적이나 상용 전체 완성을 의미하지 않습니다.',40,166,size=12,color=MUTED)
    para(c,'목차: 제품 소개 / 시작하기 / 화면별 사용법 / 도표 읽기 / 제품 연결 / 도입 안내',40,96,size=12)
    c.showPage();page+=1;shell(c,key,page,'시작하기');y=H-110;y=para(c,'처음이라면, 이 순서대로.',40,y,size=25,bold=True)
    for i,step in enumerate(p['steps'],1):y=para(c,f'{i:02d}. {step}',40,y-20,size=16,bold=True)
    y=para(c,'샘플과 회사 모드',40,y-35,size=19,bold=True)
    y=para(c,('공개 대시보드는 가상 조회용입니다. 실제 자료의 저장·타인 검수·승인은 로컬 운영판 범위를 별도로 확인하세요.' if key=='flownote' else '샘플 입력은 현재 브라우저에만 저장됩니다. 회사 계정 모드는 실제 DB와 권한을 사용하며 일반 고객 가입·메일·운영 검증은 준비 중입니다.'),40,y)
    y=para(c,'실제 고객 개인정보나 민감한 파일은 공개 체험에 넣지 마세요. 모드 안내를 확인한 뒤 사용하세요.',40,y)
    y=para(c,'브라우저에서 체험하기',40,y-20,size=17,bold=True);y=para(c,p['url'],40,y,size=10,color=GREEN)
    c.linkURL(p['url'],(40,y,555,y+35),relative=0,thickness=0);c.showPage()
    for view,title,desc,steps in p['screens']:
        page+=1;shell(c,key,page,title);y=H-108;y=para(c,title,40,y,size=25,bold=True);para(c,desc,40,y,size=13,color=MUTED)
        shot=SHOTS/(('suite-charts' if view=='suite' else key+'-'+view)+'.jpg');c.setFillColor(BG);c.roundRect(36,306,523,334,12,fill=1,stroke=0)
        c.drawImage(str(shot),40,310,width=515,height=326,preserveAspectRatio=True,anchor='c',mask='auto')
        y=282
        for i,step in enumerate(steps,1):y=para(c,f'{i:02d}  {step}',40,y,size=13)
        para(c,'화면은 PDF를 확대해 확인할 수 있습니다. 버튼·메뉴 이름은 해당 샘플 기준입니다.',40,89,size=10,color=MUTED)
        c.showPage()
    page+=1;shell(c,key,page,'제공 범위와 도입 안내');y=H-112;y=para(c,'도입 전에 확인해 주세요.',40,y,size=25,bold=True)
    for item in p['limits']:y=para(c,item,40,y-15)
    y=para(c,'도입·교육·맞춤 구축',40,y-25,size=18,bold=True);y=para(c,'회사 업무와 필요한 기능을 확인한 뒤 도입 범위·기간·비용·지원 조건을 정합니다. 이 문서는 자동 결제나 계약 체결을 실행하지 않습니다.',40,y)
    y=para(c,'제품 자료는 2026년 11월 1일 구현 범위를 기준으로 작성했습니다. 준비 중인 기능을 완료 기능으로 안내하지 않습니다.',40,y,size=11,color=MUTED)
    y=para(c,'상담: ENOTE-LABS(이노트랩스) · 텔레그램 @evanlee97',40,y-20,size=13,bold=True);c.linkURL('https://t.me/evanlee97',(40,y,555,y+35),relative=0,thickness=0);c.showPage();c.save()
    assert len(PdfReader(path).pages)==len(p['screens'])+3
    target=PUBLIC/'manuals'/path.name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(path,target);shutil.copyfile(path,PUBLIC/'manuals'/(key+'-guide-charts-20261101.pdf'))

# Draw the same identities for PNG favicons and social cards; rasterization is mechanical.
for kind in (selected_products if '--product' in sys.argv else ['flownote','agencyflow','follonote','crewmemo','enote']):
    raw=io.BytesIO();cc=canvas.Canvas(raw,pagesize=(64,64));logo(cc,kind,0,0,64);cc.showPage();cc.save()
    doc=pdfium.PdfDocument(raw.getvalue());im=doc[0].render(scale=4).to_pil().convert('RGBA')
    for size in [32,180]:
        target=PUBLIC/'product-assets'/f'{kind}-{size}.png';im.resize((size,size),Image.Resampling.LANCZOS).save(target)
    if kind=='agencyflow':
        shutil.copyfile(PUBLIC/'product-assets/agencyflow-32.png',PUBLIC/'favicon-32.png');shutil.copyfile(PUBLIC/'product-assets/agencyflow-180.png',PUBLIC/'apple-touch-icon.png')
    if kind=='flownote':
        for size,name in [(32,'favicon-32.png'),(180,'apple-touch-icon.png')]:shutil.copyfile(PUBLIC/'product-assets'/f'{kind}-{size}.png',ROOT/'demos/weekly-report/assets'/name)
    raw=io.BytesIO();cc=canvas.Canvas(raw,pagesize=(1200,630));cc.setFillColor(white);cc.rect(0,0,1200,630,fill=1,stroke=0);logo(cc,kind,48,520,60)
    name='ENOTE-LABS(이노트랩스)' if kind=='enote' else products[kind]['name'];tag='회사에 맞는 업무 시스템' if kind=='enote' else products[kind]['tag']
    cc.setFillColor(INK);cc.setFont('PretendardBold',34);cc.drawString(130,540,name);cc.setFont('PretendardBold',44);cc.drawString(48,440,tag);cc.setFont('Pretendard',20);cc.setFillColor(MUTED);cc.drawString(48,390,'ENOTE-LABS · 실제 화면으로 살펴보는 제품과 업무 흐름')
    shot=SHOTS/(('flownote' if kind=='enote' else kind)+'-dash.jpg');cc.drawImage(str(shot),48,-350,width=1104,height=699,preserveAspectRatio=True,anchor='c');cc.showPage();cc.save();doc=pdfium.PdfDocument(raw.getvalue());img=doc[0].render(scale=1).to_pil().convert('RGB')
    target=(ROOT/'studio/assets/og-studio.png') if kind=='enote' else (PUBLIC/'og-agencyflow.png' if kind=='agencyflow' else PUBLIC/'product-assets'/f'{kind}-og.png');img.save(target)
    if kind=='flownote':img.save(ROOT/'demos/weekly-report/assets/og-image.jpg',quality=92)

for kind in products:
    shutil.copyfile(SHOTS/(kind+'-dash.jpg'),ROOT/'studio/assets'/(kind+'-screen.jpg'))
    if kind in ['follonote','crewmemo']:shutil.copyfile(SHOTS/(kind+'-dash.jpg'),PUBLIC/'product-assets'/(kind+'-screen.jpg'))

# Render every PDF page for mandatory visual review and text verification.
for path in [OUT/(key+'-guide.pdf') for key in selected_products]:
    doc=pdfium.PdfDocument(str(path));pages=[]
    for i in range(len(doc)):
        image=doc[i].render(scale=0.65).to_pil().convert('RGB');image.save(TMP/f'{path.stem}-{i+1:02d}.png');pages.append(image)
    contact=Image.new('RGB',(pages[0].width*3,pages[0].height*((len(pages)+2)//3)), '#dddddd')
    for i,image in enumerate(pages):contact.paste(image,((i%3)*image.width,(i//3)*image.height))
    contact.save(TMP/(path.stem+'-contact.png'))
    text=''.join(p.extract_text() or '' for p in PdfReader(path).pages)
    assert 'ENOTE-LABS' in text and '가상' in text and '제공' in text
    print(path.name,len(doc),'pages',path.stat().st_size,'bytes')
