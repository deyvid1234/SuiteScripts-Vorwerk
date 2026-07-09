from pathlib import Path

prod_path = Path(r'c:\Git\SuiteScripts-Vorwerk\Vorwerk_project\Vorwerk Auth RESTlet - PROD BASE.js')
sandbox_path = Path(r'c:\Git\SuiteScripts-Vorwerk\Vorwerk_project\Vorwerk Auth RESTlet.js')
out_path = Path(r'c:\Git\SuiteScripts-Vorwerk\Vorwerk_project\Vorwerk Auth RESTlet - PRODUCTION MERGE.js')

prod = prod_path.read_text(encoding='utf-8').splitlines(keepends=True)
sandbox = sandbox_path.read_text(encoding='utf-8').splitlines(keepends=True)

block_getdata = sandbox[525:847]
block_tmlite = sandbox[991:1398]

lines = list(prod)

for i, line in enumerate(lines):
    if 'case "getSalesRep":' in line:
        j = i + 1
        while j < len(lines) and 'break;' not in lines[j]:
            j += 1
        insert_at = j + 1
        cases = [
            '                case "getDataEmployee":\n',
            '                    res = getStatusCSF(req_info)\n',
            '                break;\n',
        ]
        lines[insert_at:insert_at] = cases
        break

for i, line in enumerate(lines):
    if 'case "createSalesRep":' in line:
        j = i + 1
        while j < len(lines) and 'break;' not in lines[j]:
            j += 1
        insert_at = j + 1
        cases = [
            '                case "updateTMlite":\n',
            '                case "altaTMlite":\n',
            '                    res = updateUserTMlite(req_info)\n',
            '                break;\n',
        ]
        lines[insert_at:insert_at] = cases
        break

marker_create = '    /***************incio de funciones de creacion**********/\n'
idx = next(i for i, l in enumerate(lines) if l == marker_create)
lines[idx:idx] = block_getdata

marker_odv = '    //fincion para crear ODV\n'
idx = next(i for i, l in enumerate(lines) if l == marker_odv)
lines[idx:idx] = block_tmlite

patch_create = """            if (type_user === 'employee' && (
                Object.prototype.hasOwnProperty.call(req_info, 'custentity_status_csf') ||
                Object.prototype.hasOwnProperty.call(req_info, 'url_csf')
            )) {
                obj_user.setValue({
                    fieldId: 'custentity_status_csf',
                    value: payloadTieneStatusCsf(req_info['custentity_status_csf'], req_info['url_csf'])
                });
            }
"""
for i, line in enumerate(lines):
    if "obj_user.setValue({fieldId:'language',value:\"es_AR\"});" in line:
        if 'function createUser' in ''.join(lines[max(0, i - 200):i]):
            lines[i:i] = [patch_create]
            break

patch_update = """                if (type_user === 'employee' && (
                    Object.prototype.hasOwnProperty.call(req_info, 'custentity_status_csf') ||
                    Object.prototype.hasOwnProperty.call(req_info, 'url_csf')
                )) {
                    obj_user.setValue({
                        fieldId: 'custentity_status_csf',
                        value: payloadTieneStatusCsf(req_info['custentity_status_csf'], req_info['url_csf'])
                    });
                }
"""
in_update = False
for i, line in enumerate(lines):
    if 'function updateUser(req_info,type_user)' in line:
        in_update = True
    if in_update and line.strip() == "if('address' in req_info){":
        lines[i:i] = [patch_update]
        break

text = ''.join(lines)
text = text.replace(
    "recipients: ['ptorresm@yahoo.com','griselrdz@gmail.com'],//'cae@thermomix.mx',",
    "recipients: ['cae@thermomix.mx'],",
)
out_path.write_text(text, encoding='utf-8')
print('written', out_path)
print('lines', len(text.splitlines()))
print('authApiLog', text.count('authApiLog'))
print('updateTMlite', text.count('updateTMlite'))
print('getDataEmployee', text.count('getDataEmployee'))
print('payloadTieneStatusCsf', text.count('payloadTieneStatusCsf'))
print('cae@thermomix.mx', text.count('cae@thermomix.mx'))
