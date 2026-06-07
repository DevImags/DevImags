
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('upload-excel');


let dadosOriginaisPlanilha = [];
let planilhaWorkbookGlobal = null;
let dadosOriginaisPlanilha = []; 
let planilhaWorkbookGlobal = null; 
let propriedadesSelecionadas = new Set();
let operacoesSelecionadas = new Set();
let operacoesSelecionadas = new Set();
let cicloSelecionado = "Cana Planta";

if (dropZone) {
    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('hover');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('hover'));

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('hover');
        const arquivos = e.dataTransfer.files;
        if (arquivos.length) processarPlanilha(arquivos[0]);
    });
}

if (fileInput) {
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) processarPlanilha(e.target.files[0]);
    });
}

function formatarDataBR(dataInput) {
    if (!dataInput) return '-';
    let d = new Date(dataInput);
    if (isNaN(d.getTime())) return dataInput.toString(); 
    let dia = d.getDate().toString().padStart(2, '0');
    let mes = (d.getMonth() + 1).toString().padStart(2, '0');
    let ano = d.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

const btnCanaPlanta = document.getElementById('btn-cana-planta');
const btnCanaSoca = document.getElementById('btn-cana-soca');

if (btnCanaPlanta && btnCanaSoca) {
    btnCanaPlanta.addEventListener('click', () => {
        if (cicloSelecionado === "Cana Planta") return;
        cicloSelecionado = "Cana Planta";
        btnCanaPlanta.classList.add('active');
        btnCanaSoca.classList.remove('active');
        propriedadesSelecionadas.clear();
        
        propriedadesSelecionadas.clear();
        operacoesSelecionadas.clear();
        
        renderizarKanban(dadosOriginaisPlanilha);
        
        if (planilhaWorkbookGlobal) processarAbasDoWorkbook(planilhaWorkbookGlobal);
    });

    btnCanaSoca.addEventListener('click', () => {
        if (cicloSelecionado === "Cana Soca") return;
        cicloSelecionado = "Cana Soca";
        btnCanaSoca.classList.add('active');
        btnCanaPlanta.classList.remove('active');
        
        propriedadesSelecionadas.clear();
        operacoesSelecionadas.clear();
        
        renderizarKanban(dadosOriginaisPlanilha);
        
        if (planilhaWorkbookGlobal) processarAbasDoWorkbook(planilhaWorkbookGlobal);
    });
}

function gerarFiltrosLaterais(dados) {
    const containerFiltros = document.getElementById('lista-propriedades-filtros');
    if (!containerFiltros) return;
    containerFiltros.innerHTML = '';
    const propriedadesUnicas = new Set();

    dados.forEach(row => {
        const codProp = row['Propriedade'] ? row['Propriedade'].toString().trim() : '';
        const fazenda = row['Fundo Agrícola'] || row['Fundo Agricola'];
        if (fazenda) {
            const nomeFazendaTratado = fazenda.toString().trim();
            propriedadesUnicas.add(codProp ? `${codProp} - ${nomeFazendaTratado}` : nomeFazendaTratado);
        }
    });

    const listaOrdenada = Array.from(propriedadesUnicas).sort((a, b) => {
        const numA = parseInt(a.split(' - ')[0]) || 0;
        const numB = parseInt(b.split(' - ')[0]) || 0;
        if (numA !== numB) return numA - numB;
        return a.localeCompare(b);
    });

    if (propriedadesSelecionadas.size === 0) {
        listaOrdenada.forEach(p => propriedadesSelecionadas.add(p));
    }

    function atualizarVisualCheckboxes() {
        containerFiltros.querySelectorAll('.filtro-opcao').forEach(div => {
            const propNome = div.getAttribute('data-propriedade');
            const chk = div.querySelector('.chk-fazenda');
            if (chk) {
                chk.checked = propriedadesSelecionadas.has(propNome);
                if (propriedadesSelecionadas.has(propNome)) {
                    div.classList.add('active');
                } else {
                    div.classList.remove('active');
                }
            }
        });
    }

    listaOrdenada.forEach(propriedade => {
        const divOpcao = document.createElement('div');
        divOpcao.className = 'filtro-opcao';
        divOpcao.setAttribute('data-propriedade', propriedade);
        divOpcao.style.display = 'flex';
        divOpcao.style.alignItems = 'center';
        divOpcao.style.marginBottom = '6px';
        divOpcao.style.cursor = 'pointer';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'chk-fazenda';
        checkbox.style.marginRight = '8px';
        checkbox.style.pointerEvents = 'none';

        const label = document.createElement('label');
        label.innerText = propriedade;
        label.style.cursor = 'pointer';

        divOpcao.appendChild(checkbox);
        divOpcao.appendChild(label);
        containerFiltros.appendChild(divOpcao);

        divOpcao.addEventListener('click', (e) => {
            const pressionouCtrl = e.ctrlKey || e.metaKey;

            if (pressionouCtrl) {
                if (propriedadesSelecionadas.has(propriedade)) {
                    propriedadesSelecionadas.delete(propriedade);
                } else {
                    propriedadesSelecionadas.add(propriedade);
                }
            } else {
                propriedadesSelecionadas.clear();
                propriedadesSelecionadas.add(propriedade);
            }

            atualizarVisualCheckboxes();
            renderizarKanban(dadosOriginaisPlanilha);
        });
    });

    const btnMarcarTodos = document.getElementById('btn-marcar-todos');
    const btnDesmarcarTodos = document.getElementById('btn-desmarcar-todos');

    if (btnMarcarTodos) {
        const novoBtnMarcar = btnMarcarTodos.cloneNode(true);
        btnMarcarTodos.parentNode.replaceChild(novoBtnMarcar, btnMarcarTodos);
        novoBtnMarcar.addEventListener('click', () => {
            listaOrdenada.forEach(p => propriedadesSelecionadas.add(p));
            atualizarVisualCheckboxes();
            renderizarKanban(dadosOriginaisPlanilha);
        });
    }
    if (btnDesmarcarTodos) {
        const novoBtnDesmarcar = btnDesmarcarTodos.cloneNode(true);
        btnDesmarcarTodos.parentNode.replaceChild(novoBtnDesmarcar, btnDesmarcarTodos);
        novoBtnDesmarcar.addEventListener('click', () => {
            propriedadesSelecionadas.clear(); 
            atualizarVisualCheckboxes();      
            renderizarKanban(dadosOriginaisPlanilha); 
        });
    }

    atualizarVisualCheckboxes();
}

function gerarFiltrosOperacoes(operacoesMapeadas) {
    const containerOps = document.getElementById('lista-operacoes-filtros');
    if (!containerOps) return;
    containerOps.innerHTML = '';
    if (operacoesSelecionadas.size === 0) {
        operacoesMapeadas.forEach(op => operacoesSelecionadas.add(op.cod));
    }

    function atualizarVisualOps() {
        containerOps.querySelectorAll('.filtro-opcao').forEach(div => {
            const codOp = div.getAttribute('data-op');
            const chk = div.querySelector('.chk-op');
            
            if (operacoesSelecionadas.has(codOp)) {
                div.classList.add('active');
                if (chk) chk.checked = true;
            } else {
                div.classList.remove('active');
                if (chk) chk.checked = false;
            }
        });
    }

    operacoesMapeadas.forEach(op => {
        const divOpcao = document.createElement('div');
        divOpcao.className = 'filtro-opcao'; 
        divOpcao.setAttribute('data-op', op.cod);
        
        divOpcao.style.display = 'flex';
        divOpcao.style.alignItems = 'center';
        divOpcao.style.width = '100%';
        divOpcao.style.boxSizing = 'border-box';
        divOpcao.style.padding = '8px 10px';
        divOpcao.style.marginBottom = '6px';
        divOpcao.style.cursor = 'pointer';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'chk-op';
        checkbox.style.marginRight = '10px';
        checkbox.style.pointerEvents = 'none';

        const label = document.createElement('label');
        label.innerHTML = `<strong style="color: #4CAF50;">${op.cod}</strong> - ${op.desc}`;
        label.style.cursor = 'pointer';
        label.style.fontSize = '11px';
        label.style.flex = '1';
        label.style.pointerEvents = 'none';

        divOpcao.appendChild(checkbox);
        divOpcao.appendChild(label);
        containerOps.appendChild(divOpcao);

        divOpcao.addEventListener('click', (e) => {
            const pressionouCtrl = e.ctrlKey || e.metaKey;

            if (pressionouCtrl) {
                if (operacoesSelecionadas.has(op.cod)) {
                    operacoesSelecionadas.delete(op.cod);
                } else {
                    operacoesSelecionadas.add(op.cod);
                }
            } else {
                operacoesSelecionadas.clear();
                operacoesSelecionadas.add(op.cod);
            }

            atualizarVisualOps();
            renderizarKanban(dadosOriginaisPlanilha);
        });
    });

    const btnMarcar = document.getElementById('btn-marcar-ops');
    const btnDesmarcar = document.getElementById('btn-desmarcar-ops');

    if (btnMarcar) {
        const novoBtn = btnMarcar.cloneNode(true);
        btnMarcar.parentNode.replaceChild(novoBtn, btnMarcar);
        novoBtn.addEventListener('click', () => {
            operacoesMapeadas.forEach(op => operacoesSelecionadas.add(op.cod));
            atualizarVisualOps();
            renderizarKanban(dadosOriginaisPlanilha);
        });
    }
    if (btnDesmarcar) {
        const novoBtn = btnDesmarcar.cloneNode(true);
        btnDesmarcar.parentNode.replaceChild(novoBtn, btnDesmarcar);
        novoBtn.addEventListener('click', () => {
            operacoesSelecionadas.clear(); 
            atualizarVisualOps();          
            renderizarKanban(dadosOriginaisPlanilha); 
        });
    }

    atualizarVisualOps();
}

function renderizarKanban(dados) {
    const colSemPlantio = document.getElementById('col-sem-plantio');
    const colPendentes = document.getElementById('col-pendentes');
    const colAndamento = document.getElementById('col-andamento');
    const colRealizadas = document.getElementById('col-realizadas');
    
    const colReforma = document.getElementById('col-reforma'); 
    const blocoReforma = document.getElementById('bloco-reforma');

    if (blocoReforma) {
        if (cicloSelecionado === "Cana Planta") {
            blocoReforma.style.display = 'none'; 
        } else {
            blocoReforma.style.display = ''; 
            
            if (colReforma) {
                colReforma.innerHTML = '<p class="empty-column-msg">Nenhuma área registrada.</p>';
            }
        }
    }

    if (colSemPlantio) colSemPlantio.innerHTML = '';
    if (colPendentes) colPendentes.innerHTML = '';
    if (colAndamento) colAndamento.innerHTML = '';
    if (colRealizadas) colRealizadas.innerHTML = '';
    if (colReforma && cicloSelecionado === "Cana Soca") {
        colReforma.innerHTML = ''; 
    }
    let operacoesMapeadas = [];
    if (cicloSelecionado === "Cana Planta") {
        operacoesMapeadas = [
            { cod: '2078', desc: 'QUEBRA LOMBOS COM DEFENSIVOS', colsDt: ['Dt. 2078', 'Dt.-2078'] },
            { cod: '2079', desc: 'QUEBRA LOMBO COM DEFENSIVOS - TERCEIROS', colsDt: ['Dt. 2079', 'Dt.-2079'] },
            { cod: '2087', desc: 'APLICACAO DEFENSIVOS (PULVERIZADOR)', colsDt: ['Dt. 2087', 'Dt.-2087'] },
            { cod: '2138', desc: 'APLICACAO DEFENSIVOS AUTOPROPELIDO', colsDt: ['Dt. 2138', 'Dt.-2138'] },
            { cod: '2143', desc: 'QUEBRA LOMBOS SEM DEFENSIVOS', colsDt: ['Dt. 2143', 'Dt.-2143'] }
        ];
    } else {
        operacoesMapeadas = [
            { cod: '2070', desc: 'ENLEIRAMENTO PALHA - TERCEIROS', colsDt: ['Dt. 2070', 'Dt.-2070'] },
            { cod: '2081', desc: 'ENLEIRAMENTO PALHA', colsDt: ['Dt. 2081', 'Dt.-2081'] },
            { cod: '2082', desc: 'CULTIVO SEM INSUMOS', colsDt: ['Dt. 2082', 'Dt.-2082'] },
            { cod: '2083', desc: 'CULTIVO COM INSUMOS', colsDt: ['Dt. 2083', 'Dt.-2083'] },
            { cod: '2086', desc: 'CORTE DE SOQUEIRA', colsDt: ['Dt. 2086', 'Dt.-2086'] },
            { cod: '2087', desc: 'APLICACAO DEFENSIVOS (PULVERIZADOR)', colsDt: ['Dt. 2087', 'Dt.-2087'] },
            { cod: '2111', desc: 'FERTIRRIGACAO VINHACA', colsDt: ['Dt. 2111', 'Dt.-2111'] },
            { cod: '2127', desc: 'DESENLEIRAMENTO PALHA', colsDt: ['Dt. 2127', 'Dt.-2127'] },
            { cod: '2128', desc: 'DESENLEIRAMENTO PALHA - TERCEIROS', colsDt: ['Dt. 2128', 'Dt.-2128'] },
            { cod: '2138', desc: 'APLICACAO DEFENSIVOS AUTOPROPELIDO', colsDt: ['Dt. 2138', 'Dt.-2138'] },
            { cod: '2147', desc: 'APLICACAO AJIFER - TERCEIROS', colsDt: ['Dt. 2147', 'Dt.-2147'] },
            { cod: '2187', desc: 'CORTE DE SOQUEIRA - TERCEIROS', colsDt: ['Dt. 2187', 'Dt.-2187'] }
        ];
    }
    let historicoTalhoesGlobal = {};

    dados.forEach(row => {
        let codProp = (row['Propriedade'] || '').toString().trim();
        let talhao = (row['Talhão'] || row['Talhao'] || '').toString().trim();
        if (!codProp || !talhao) return;

        let chaveTalhao = `${codProp}_${talhao}`;
        if (!historicoTalhoesGlobal[chaveTalhao]) {
            historicoTalhoesGlobal[chaveTalhao] = {};
            operacoesMapeadas.forEach(op => {
                historicoTalhoesGlobal[chaveTalhao][op.cod] = { realizada: false, ativa: false };
            });
        }

        operacoesMapeadas.forEach(op => {
            let statusOSStr = (row[`Status da O.S. ${op.cod}`] || row[`Status da O.S.${op.cod}`] || '').toString().trim().toUpperCase();
            let osString = (row[`OS-${op.cod}`] || row[`OS ${op.cod}`] || '').toString().trim();
            
            let temData = false;
            for (let col of op.colsDt) {
                if (row[col] !== undefined && row[col] !== '' && row[col] !== '-') {
                    temData = true;
                    break;
                }
            }

            if (temData || statusOSStr === 'ENCERRADA' || statusOSStr === 'CONCLUIDA') {
                historicoTalhoesGlobal[chaveTalhao][op.cod].realizada = true;
            } else if ((osString && osString !== '-') || statusOSStr === 'LIBERADA' || statusOSStr === 'ANDAMENTO') {
                historicoTalhoesGlobal[chaveTalhao][op.cod].active = true;
                historicoTalhoesGlobal[chaveTalhao][op.cod].ativa = true;
            }
        });
    });

    const cartoesSemPlantioAgrupados = {};
    const cartoesReformaAgrupados = {};
    const cartoesPendentesAgrupados = {};
    const cartoesAndamentoAgrupados = {}; 
    const cartoesRealizadasAgrupados = {};

    const linesProcessadas = [];

    dados.forEach(row => {
        const codProp = row['Propriedade'] ? row['Propriedade'].toString().trim() : '';
        const fazenda = row['Fundo Agrícola'] || row['Fundo Agricola'];
        if (!fazenda) return;

        const nomeFazendaTratado = fazenda.toString().trim();
        const chaveFiltroPropriedade = codProp ? `${codProp} - ${nomeFazendaTratado}` : nomeFazendaTratado;
    
        if (propriedadesSelecionadas.size === 0 || !propriedadesSelecionadas.has(chaveFiltroPropriedade)) return;

        const talhao = (row['Talhão'] || row['Talhao'] || '').toString().trim();
        if (!talhao) return;

        const areaFloat = parseFloat(row['Área Planejada'] || row['Área do Talhão'] || row['Área Plantada'] || 0) || 0;

        if (cicloSelecionado === "Cana Soca" && row['__isReforma'] === true) {
            linesProcessadas.push({
                tipo: 'reforma',
                fazenda: nomeFazendaTratado,
                codPropriedade: codProp,
                talhao: talhao,
                area: areaFloat
            });
            return;
        }
        
        let dataStartRaw = cicloSelecionado === "Cana Planta" ? row['Encerramento. Plantio'] : row['Data Colheita'];
        const osStart = row['OS-Plantio'] ? row['OS-Plantio'].toString().trim() : '-';
        const tipoOperacaoStart = row['Operação'] ? row['Operação'].toString().trim() : '';

        const dataStartStr = dataStartRaw ? dataStartRaw.toString().trim() : '';
        
        if (dataStartStr === '' || dataStartStr === '-') {
            linesProcessadas.push({
                tipo: 'sem_plantio',
                fazenda: nomeFazendaTratado,
                codPropriedade: codProp,
                talhao: talhao,
                area: areaFloat,
                numOSPlantio: osStart,
                tipoOperacao: tipoOperacaoStart
            });
            return; 
        }

        const diasAtual = row['Dias Plantado/Colhido'] !== undefined ? row['Dias Plantado/Colhido'] : '0';
        let chaveTalhao = `${codProp}_${talhao}`;

        let statusGeralOps = {};
        operacoesMapeadas.forEach(op => {
            let statusGlobal = historicoTalhoesGlobal[chaveTalhao][op.cod];
            statusGeralOps[op.cod] = {
                realizada: statusGlobal.realizada,
                ativa: !statusGlobal.realizada && statusGlobal.ativa,
                emBranco: !statusGlobal.realizada && !statusGlobal.ativa
            };
        });

        if (cicloSelecionado === "Cana Soca") {
            const preferencia2083AtivaOuPronta = statusGeralOps['2083']?.ativa || statusGeralOps['2083']?.realizada;
            if (preferencia2083AtivaOuPronta && statusGeralOps['2082']) {
                statusGeralOps['2082'] = { ativa: false, realizada: false, emBranco: false };
            }
        }

        let opsPendentesDestaLinha = [];
        let opsRealizadasDestaLinha = [];

        operacoesMapeadas.forEach(op => {
            if (operacoesSelecionadas.size === 0 || !operacoesSelecionadas.has(op.cod)) return;

            let opInfo = statusGeralOps[op.cod];

            if ((op.cod === '2138' || op.cod === '2082') && opInfo.emBranco) {
                return;
            }

            if (cicloSelecionado === "Cana Planta") {
                const tem2087AtivaOuRealizada = historicoTalhoesGlobal[chaveTalhao]['2087']?.realizada || historicoTalhoesGlobal[chaveTalhao]['2087']?.ativa;
                const tem2138AtivaOuRealizada = historicoTalhoesGlobal[chaveTalhao]['2138']?.realizada || historicoTalhoesGlobal[chaveTalhao]['2138']?.ativa;

                if (op.cod === '2138' && opInfo.emBranco && tem2087AtivaOuRealizada) return;
                if (op.cod === '2087' && statusGeralOps['2087'].emBranco && tem2138AtivaOuRealizada) return;

                const tem2078AtivaOuRealizada = statusGeralOps['2078']?.ativa || statusGeralOps['2078']?.realizada;
                if (op.cod === '2143' && statusGeralOps['2143'].emBranco && tem2078AtivaOuRealizada) return;

                const b2078EmBranco = statusGeralOps['2078']?.emBranco;
                const b2079EmBranco = statusGeralOps['2079']?.emBranco;

                if (op.cod === '2078' && b2078EmBranco && !b2079EmBranco) return;
                if (op.cod === '2079' && ((b2078EmBranco && b2079EmBranco) || (b2079EmBranco && !b2078EmBranco))) return;
            }

            let osString = (row[`OS-${op.cod}`] || row[`OS ${op.cod}`] || '').toString().trim();
            let osChave = (osString && osString !== '-') ? osString : '-';

            if (opInfo.realizada) {
                let dataOpRealizadaRaw = '';
                for (let col of op.colsDt) {
                    if (row[col] !== undefined && row[col] !== '' && row[col] !== '-') {
                        dataOpRealizadaRaw = row[col];
                        break;
                    }
                }
                opsRealizadasDestaLinha.push({ cod: op.cod, desc: op.desc, os: osChave, dataRaw: dataOpRealizadaRaw });
            } else if (opInfo.ativa) {
                linesProcessadas.push({
                    tipo: 'andamento',
                    fazenda: nomeFazendaTratado,
                    codPropriedade: codProp,
                    dias: diasAtual,
                    talhao: talhao,
                    area: areaFloat,
                    opCod: op.cod,
                    opDesc: op.desc,
                    numOS: osChave
                });
            } else if (opInfo.emBranco) {
                if (cicloSelecionado === "Cana Soca") {
                    if (op.cod === '2086') return;
                    if (op.cod === '2082') return;
                    if (op.cod === '2111') {
                        const v2082Ativa = statusGeralOps['2082']?.ativa;
                        const v2082Realizada = statusGeralOps['2082']?.realizada;
                        if (!v2082Ativa && !v2082Realizada) return;
                    }
                    if (['2081', '2127', '2128'].includes(op.cod)) return;
                }
                opsPendentesDestaLinha.push({ cod: op.cod, desc: op.desc });
            }
        });

        if (opsRealizadasDestaLinha.length > 0) {
            const essenciais = ['2083', '2147', '2187', '2087', '2143', '2078', '2138', '2082'];
            const possuiEssencial = opsRealizadasDestaLinha.some(o => essenciais.includes(o.cod));
            if (possuiEssencial) {
                opsRealizadasDestaLinha = opsRealizadasDestaLinha.filter(o => essenciais.includes(o.cod));
            }
            if (opsRealizadasDestaLinha.length > 0) {
                linesProcessadas.push({
                    tipo: 'realizadas',
                    fazenda: nomeFazendaTratado,
                    codPropriedade: codProp,
                    dias: diasAtual,
                    talhao: talhao,
                    area: areaFloat,
                    operacoesRealizadas: opsRealizadasDestaLinha
                });
            }
        }

        if (opsPendentesDestaLinha.length > 0) {
            linesProcessadas.push({
                tipo: 'pendentes',
                fazenda: nomeFazendaTratado,
                codPropriedade: codProp,
                dias: diasAtual,
                talhao: talhao,
                area: areaFloat,
                operacoes: opsPendentesDestaLinha
            });
        }
    });
    linesProcessadas.forEach(item => {
        if (item.tipo === 'reforma') {
            const chave = `REFORMA_${item.fazenda}`;
            if (!cartoesReformaAgrupados[chave]) {
                cartoesReformaAgrupados[chave] = { fazenda: item.fazenda, codPropriedade: item.codPropriedade, areaTotal: item.area, talhoes: [item.talhao] };
            } else {
                if (!cartoesReformaAgrupados[chave].talhoes.includes(item.talhao)) cartoesReformaAgrupados[chave].talhoes.push(item.talhao);
                cartoesReformaAgrupados[chave].areaTotal += item.area;
            }
        } else if (item.tipo === 'sem_plantio') {
            const chave = `SEMPLANTIO_${item.fazenda}_${item.numOSPlantio}_${item.tipoOperacao}`;
            if (!cartoesSemPlantioAgrupados[chave]) {
                cartoesSemPlantioAgrupados[chave] = { fazenda: item.fazenda, codPropriedade: item.codPropriedade, areaTotal: item.area, talhoes: [item.talhao], numOSPlantio: item.numOSPlantio, tipoOperacao: item.tipoOperacao };
            } else {
                if (!cartoesSemPlantioAgrupados[chave].talhoes.includes(item.talhao)) cartoesSemPlantioAgrupados[chave].talhoes.push(item.talhao);
                cartoesSemPlantioAgrupados[chave].areaTotal += item.area;
            }
        } else if (item.tipo === 'pendentes') {
            const stringOps = item.operacoes.map(o => o.cod).sort().join('-');
            const chave = `PENDENTE_${item.fazenda}_${item.dias}_${stringOps}`;
            if (!cartoesPendentesAgrupados[chave]) {
                cartoesPendentesAgrupados[chave] = { fazenda: item.fazenda, codPropriedade: item.codPropriedade, dias: item.dias, areaTotal: item.area, talhoes: [item.talhao], operacoes: item.operacoes };
            } else {
                if (!cartoesPendentesAgrupados[chave].talhoes.includes(item.talhao)) cartoesPendentesAgrupados[chave].talhoes.push(item.talhao);
                cartoesPendentesAgrupados[chave].areaTotal += item.area;
            }
        } else if (item.tipo === 'andamento') {
            const chaveAgruparOS = (item.numOS !== '-') ? item.numOS : `OP_${item.opCod}`;
            const chave = `ANDAMENTO_${item.fazenda}_${chaveAgruparOS}`;
            if (!cartoesAndamentoAgrupados[chave]) {
                cartoesAndamentoAgrupados[chave] = { fazenda: item.fazenda, codPropriedade: item.codPropriedade, diasMax: parseInt(item.dias) || 0, talhoes: [item.talhao], areaTotal: item.area, opCod: item.opCod, opDesc: item.opDesc, numOS: item.numOS };
            } else {
                if (!cartoesAndamentoAgrupados[chave].talhoes.includes(item.talhao)) { cartoesAndamentoAgrupados[chave].talhoes.push(item.talhao); cartoesAndamentoAgrupados[chave].areaTotal += item.area; }
                const idadeAtualInt = parseInt(item.dias) || 0;
                if (idadeAtualInt > cartoesAndamentoAgrupados[chave].diasMax) { cartoesAndamentoAgrupados[chave].diasMax = idadeAtualInt; }
            }
        } else if (item.tipo === 'realizadas') {
            const assinaturaOps = item.operacoesRealizadas.map(o => o.cod).sort().join('-');
            const chave = `REALIZADAS_${item.fazenda}_${assinaturaOps}`;
            if (!cartoesRealizadasAgrupados[chave]) {
                cartoesRealizadasAgrupados[chave] = { fazenda: item.fazenda, codPropriedade: item.codPropriedade, dias: item.dias, talhoes: [item.talhao], areaTotal: item.area, operacoes: item.operacoesRealizadas, datasLista: item.operacoesRealizadas.map(o => o.dataRaw) };
            } else {
                if (!cartoesRealizadasAgrupados[chave].talhoes.includes(item.talhao)) { cartoesRealizadasAgrupados[chave].talhoes.push(item.talhao); cartoesRealizadasAgrupados[chave].areaTotal += item.area; }
                item.operacoesRealizadas.forEach(o => { cartoesRealizadasAgrupados[chave].datasLista.push(o.dataRaw); });
            }
        }
    });

    function extrairStringTalhoesLimpa(arrayTalhoes) { return [...new Set(arrayTalhoes)].sort((a, b) => (parseFloat(a) || 0) - (parseFloat(b) || 0)).join(', '); }
    function determinarUltimaDataFormatada(listaDatas) { let maiorData = null; for (let d of listaDatas) { if (!d || d === 'Concluída' || d === '-') continue; const dataConv = new Date(d); if (!isNaN(dataConv.getTime()) && (!maiorData || dataConv > maiorData)) { maiorData = dataConv; } } return maiorData ? formatarDataBR(maiorData) : 'Concluída'; }

    let totalCardsSemPlantio = 0, areaTotalSemPlantio = 0;
    let totalCardsReforma = 0, areaTotalReforma = 0;
    let totalCardsPendentes = 0, totalCardsAndamento = 0, totalCardsRealizadas = 0;
    if (colSemPlantio) {
        Object.values(cartoesSemPlantioAgrupados).forEach(grupo => {
            totalCardsSemPlantio++;
            areaTotalSemPlantio += grupo.areaTotal;

            let textoStatusAjuda = cicloSelecionado === "Cana Planta" ? "Aguardando início do plantio." : "Aguardando colheita/corte.";
            let blocoInfoPlantioIniciado = '';

            if (grupo.numOSPlantio !== '-' || grupo.tipoOperacao !== '') {
                textoStatusAjuda = "Plantio/Operação em Andamento.";
                blocoInfoPlantioIniciado = `
                    <div style="margin-top: 5px; background: rgba(255,255,255,0.05); padding: 4px; border-radius: 4px;">
                        ${grupo.numOSPlantio !== '-' ? `<p style="font-size: 10px; color: #ffeb3b; margin: 0;"><strong>O.S.: ${grupo.numOSPlantio}</strong></p>` : ''}
                        ${grupo.tipoOperacao !== '' ? `<p style="font-size: 10px; color: #bbb; margin: 2px 0 0 0;"><strong>${grupo.tipoOperacao}</strong></p>` : ''}
                    </div>
                `;
            }

            colSemPlantio.innerHTML += `
                <article class="card" style="border-left: 5px solid #9c27b0;">
                    <h3>${grupo.codPropriedade ? `${grupo.codPropriedade} - ${grupo.fazenda.toUpperCase()}` : grupo.fazenda.toUpperCase()}</h3>
                    <p><strong>Talões:</strong> ${extrairStringTalhoesLimpa(grupo.talhoes)} | <strong>Área:</strong> ${grupo.areaTotal.toFixed(2)} há</p>
                    ${blocoInfoPlantioIniciado}
                    <p class="card-help-text" style="margin-top: 6px;">${textoStatusAjuda}</p>
                    <div class="card-badge-container"><span class="status-alert default" style="background: #4a148c;">${cicloSelecionado === "Cana Planta" ? "🌱 Sem Plantio" : "🪵 Sem Corte"}</span></div>
                </article>`;
        });
    }

    if (colReforma && cicloSelecionado === "Cana Soca") {
        Object.values(cartoesReformaAgrupados).forEach(grupo => {
            totalCardsReforma++;
            areaTotalReforma += grupo.areaTotal;

            colReforma.innerHTML += `
                <article class="card" style="border-left: 5px solid #e74c3c;">
                    <h3>${grupo.codPropriedade ? `${grupo.codPropriedade} - ${grupo.fazenda.toUpperCase()}` : grupo.fazenda.toUpperCase()}</h3>
                    <p><strong>Talões:</strong> ${extrairStringTalhoesLimpa(grupo.talhoes)} | <strong>Área:</strong> ${grupo.areaTotal.toFixed(2)} há</p>
                    <p class="card-help-text" style="margin-top: 6px; color: #e74c3c;">Área separada para reforma do canavial.</p>
                    <div class="card-badge-container"><span class="status-alert pending" style="background-color: #e74c3c; color: white;">🚜 Em Reforma</span></div>
                </article>`;
        });
    }

    if (colPendentes) {
        Object.values(cartoesPendentesAgrupados).sort((a, b) => (parseInt(b.dias) || 0) - (parseInt(a.dias) || 0)).forEach(grupo => {
            totalCardsPendentes++;
            let listaOpsHtml = '<div class="card-ops-list">';
            grupo.operacoes.forEach(o => { listaOpsHtml += `<span class="card-sub-op"><strong>${o.cod}</strong> - ${o.desc}</span>`; });
            listaOpsHtml += '</div>';
            colPendentes.innerHTML += `
                <article class="card" style="border-left: 5px solid #ffc107;">
                    <h3>${grupo.codPropriedade ? `${grupo.codPropriedade} - ${grupo.fazenda.toUpperCase()}` : grupo.fazenda.toUpperCase()}</h3>
                    <p><strong>Talões:</strong> ${extrairStringTalhoesLimpa(grupo.talhoes)} | <strong>Área:</strong> ${grupo.areaTotal.toFixed(2)} há</p>
                    <p class="card-label-text">Operações Pendentes:</p>
                    ${listaOpsHtml}
                    <p class="card-age">Idade Atual: <strong>${grupo.dias} Dias</strong></p>
                    <div class="card-badge-container"><span class="status-alert pending">⏳ Planejado</span></div>
                </article>`;
        });
    }

    if (colAndamento) {
        Object.values(cartoesAndamentoAgrupados).sort((a, b) => b.diasMax - a.diasMax).forEach(grupo => {
            totalCardsAndamento++;
            let blocoInfoOSHtml = grupo.numOS !== '-' ? `<p style="font-size: 10px; color: #07f743; margin: 2px 0;"><strong>O.S.: ${grupo.numOS}</strong></p>` : '';
            colAndamento.innerHTML += `
                <article class="card" style="border-left: 5px solid #2196F3;">
                    <h3>${grupo.codPropriedade ? `${grupo.codPropriedade} - ${grupo.fazenda.toUpperCase()}` : grupo.fazenda.toUpperCase()}</h3>
                    <p><strong>Talões:</strong> ${extrairStringTalhoesLimpa(grupo.talhoes)} | <strong>Área:</strong> ${grupo.areaTotal.toFixed(2)} há</p>
                    <div style="margin-top: 6px;">
                        ${blocoInfoOSHtml}
                        <p style="font-size: 10px; color: #aaa; margin: 4px 0;"><strong>Operação:</strong> ${grupo.opDesc} (${grupo.opCod})</p>
                    </div>
                    <p class="card-age">Idade Atual: <strong>${grupo.diasMax} Dias</strong></p>
                    <div class="card-badge-container"><span class="status-alert progress">⚙️ O.S. Liberada</span></div>
                </article>`;
        });
    }
    if (colRealizadas) {
        Object.values(cartoesRealizadasAgrupados).sort((a, b) => (parseInt(b.dias) || 0) - (parseInt(a.dias) || 0)).forEach(grupo => {
            totalCardsRealizadas++;
            const ultimaDataTexto = determinarUltimaDataFormatada(grupo.datasLista);
            let blocoOperacoesHtml = '<div style="margin: 6px 0; display: flex; flex-direction: column; gap: 4px;">';
            grupo.operacoes.forEach(op => {
                let txtOS = op.os !== '-' ? ` [OS: ${op.os}]` : '';
                blocoOperacoesHtml += `<p style="font-size: 10px; color: #aaa; margin: 0;"><strong>${op.cod}</strong> - ${op.desc}<span style="color: #666; font-size: 10px;">${txtOS}</span></p>`;
            });
            blocoOperacoesHtml += '</div>';
            colRealizadas.innerHTML += `
                <article class="card" style="border-left: 5px solid #4CAF50;">
                    <h3>${grupo.codPropriedade ? `${grupo.codPropriedade} - ${grupo.fazenda.toUpperCase()}` : grupo.fazenda.toUpperCase()}</h3>
                    <p><strong>Talões:</strong> ${extrairStringTalhoesLimpa(grupo.talhoes)} | <strong>Área:</strong> ${grupo.areaTotal.toFixed(2)} há</p>
                    <div style="margin-top: 6px; padding: 4px 0;">
                        ${blocoOperacoesHtml}
                    </div>
                    <p class="card-age" style="color: #4CAF50;">📅 Última realização: <strong>${ultimaDataTexto}</strong></p>
                    <div class="card-badge-container"><span class="status-alert done">✅ Concluída</span></div>
                </article>`;
        });
    }

    if (totalCardsSemPlantio === 0 && colSemPlantio) colSemPlantio.innerHTML = '<p class="empty-column-msg">Nenhuma área registrada.</p>';
    if (totalCardsReforma === 0 && colReforma && cicloSelecionado === "Cana Soca") colReforma.innerHTML = '<p class="empty-column-msg">Nenhuma área registrada.</p>';
    if (totalCardsPendentes === 0 && colPendentes) colPendentes.innerHTML = '<p class="empty-column-msg">Nenhuma área planejada.</p>';
    if (totalCardsAndamento === 0 && colAndamento) colAndamento.innerHTML = '<p class="empty-column-msg">Nenhuma área em campo.</p>';
    if (totalCardsRealizadas === 0 && colRealizadas) colRealizadas.innerHTML = '<p class="empty-column-msg">Nenhuma área encerrada.</p>';

    const txtTituloSemPlantio = document.querySelector('.not-planted-title');
    const txtTituloReforma = document.getElementById('titulo-reforma');
    const txtTituloPendentes = document.getElementById('titulo-pendentes');
    const txtTituloAndamento = document.getElementById('titulo-andamento');
    const txtTituloRealizadas = document.getElementById('titulo-realizadas');


    if (txtTituloSemPlantio) {
        const nomeColunaBase = cicloSelecionado === "Cana Planta" ? "🌱 Sem Plantio" : "🪵 Sem Corte";
        txtTituloSemPlantio.innerHTML = `${nomeColunaBase} (${totalCardsSemPlantio}) <br><strong>${areaTotalSemPlantio.toFixed(2)} há</strong>`;
    }
    
    if (txtTituloReforma) {
        txtTituloReforma.innerHTML = `🚜 Em Reforma (${totalCardsReforma}) <br><strong><span id="area-reforma">${areaTotalReforma.toFixed(2)}</span> há</strong>`;
    }

    if (txtTituloPendentes) txtTituloPendentes.innerHTML = `⏳ Planejado <br><strong>(${totalCardsPendentes})</strong>`;
    if (txtTituloAndamento) txtTituloAndamento.innerHTML = `⚙️ O.S. Liberada <br><strong>(${totalCardsAndamento})</strong>`;
    if (txtTituloRealizadas) txtTituloRealizadas.innerHTML = `✅ Realizadas <br><strong>(${totalCardsRealizadas})</strong>`;
}

function processarAbasDoWorkbook(wb) {
    let termoBusca = cicloSelecionado === "Cana Planta" ? "Tratos Cana Planta" : "Tratos Cana Soca";
    const nomeAbaAlvo = wb.SheetNames.find(name => name.includes(termoBusca)) || wb.SheetNames[0];
    
    const dadosJson = XLSX.utils.sheet_to_json(wb.Sheets[nomeAbaAlvo]);

    dadosOriginaisPlanilha = dadosJson.map(linha => {
        const ehReforma = linha['Reforma'] && linha['Reforma'].toString().trim().toLowerCase() === 'sim';
        
        linha['__isReforma'] = ehReforma; 
        
        return linha;
    });

    let operacoesMapeadas = [];
    if (cicloSelecionado === "Cana Planta") {
        operacoesMapeadas = [
            { cod: '2078', desc: 'QUEBRA LOMBOS COM DEFENSIVOS' },
            { cod: '2079', desc: 'QUEBRA LOMBO COM DEFENSIVOS - TERCEIROS' },
            { cod: '2087', desc: 'APLICACAO DEFENSIVOS (PULVERIZADOR)' },
            { cod: '2138', desc: 'APLICACAO DEFENSIVOS AUTOPROPELIDO' },
            { cod: '2143', desc: 'QUEBRA LOMBOS SEM DEFENSIVOS' }
        ];
    } else {
        operacoesMapeadas = [
            { cod: '2070', desc: 'ENLEIRAMENTO PALHA - TERCEIROS' },
            { cod: '2081', desc: 'ENLEIRAMENTO PALHA' },
            { cod: '2082', desc: 'CULTIVO SEM INSUMOS' },
            { cod: '2083', desc: 'CULTIVO COM INSUMOS' },
            { cod: '2086', desc: 'CORTE DE SOQUEIRA' },
            { cod: '2087', desc: 'APLICACAO DEFENSIVOS (PULVERIZADOR)' },
            { cod: '2111', desc: 'FERTIRRIGACAO VINHACA' },
            { cod: '2127', desc: 'DESENLEIRAMENTO PALHA' },
            { cod: '2128', desc: 'DESENLEIRAMENTO PALHA - TERCEIROS' },
            { cod: '2138', desc: 'APLICACAO DEFENSIVOS AUTOPROPELIDO' },
            { cod: '2147', desc: 'APLICACAO AJIFER - TERCEIROS' },
            { cod: '2187', desc: 'CORTE DE SOQUEIRA - TERCEIROS' }
        ];
    }
    gerarFiltrosLaterais(dadosOriginaisPlanilha);
    gerarFiltrosOperacoes(operacoesMapeadas); 
    renderizarKanban(dadosOriginaisPlanilha);
}
function processarPlanilha(arquivo) {
    const leitor = new FileReader();
    leitor.onload = function (e) {
        try {
            const dados = new Uint8Array(e.target.result);
            const workbook = XLSX.read(dados, { type: 'array', cellDates: true });
            
            planilhaWorkbookGlobal = workbook;
            processarAbasDoWorkbook(workbook);

            if (dropZone) {
                dropZone.innerHTML = `<span>✅ ${arquivo.name} carregado com sucesso!</span>`;
                dropZone.style.borderColor = "#4CAF50";
                dropZone.style.background = "rgba(76, 175, 80, 0.05)";
            }
        } catch (erro) {
            console.error("Erro ao ler arquivo Excel:", erro);
            alert("Não foi possível processar a planilha. Verifique se o formato está correto.");
        }
    };
    leitor.readAsArrayBuffer(arquivo);
}

if (document.getElementById('bloco-reforma')) {
    const cicloInicial = typeof cicloSelecionado !== 'undefined' ? cicloSelecionado : "Cana Planta";
    document.getElementById('bloco-reforma').style.display = (cicloInicial === "Cana Soca") ? '' : 'none';
}


document.addEventListener("DOMContentLoaded", () => {
    const btnPdf = document.getElementById('btn-pdf');

    if (btnPdf) {
        btnPdf.addEventListener('click', () => {
            window.focus();
            window.print();
        });
    }
});
