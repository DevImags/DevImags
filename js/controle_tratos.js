// Captura dos elementos do HTML usando os IDs corretos
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('upload-excel');

// VARIÁVEIS GLOBAIS DE CONTROLE DOS FILTROS E CICLO
let dadosOriginaisPlanilha = []; // Guarda as linhas JSON da aba ativa
let planilhaWorkbookGlobal = null; // Guarda o arquivo Excel completo na memória
let propriedadesSelecionadas = new Set();
let cicloSelecionado = "Cana Planta"; // Controla o ciclo ativo ("Cana Planta" ou "Cana Soca")

// Eventos de clique e arrastar arquivo para Upload
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

// FUNÇÃO AUXILIAR: Formata qualquer formato de data do JavaScript para DD/MM/AAAA
function formatarDataBR(valorData) {
    if (!valorData) return '';
    
    if (valorData instanceof Date) {
        if (isNaN(valorData.getTime())) return '';
        const dia = String(valorData.getDate()).padStart(2, '0');
        const mes = String(valorData.getMonth() + 1).padStart(2, '0');
        const ano = valorData.getFullYear();
        return `${dia}/${mes}/${ano}`;
    }

    const strData = valorData.toString().trim();
    if (strData === '' || strData === '-') return '';

    if (strData.includes('GMT') || strData.includes('00:00:00')) {
        const parsed = new Date(strData);
        if (!isNaN(parsed.getTime())) {
            const dia = String(parsed.getDate()).padStart(2, '0');
            const mes = String(parsed.getMonth() + 1).padStart(2, '0');
            const ano = parsed.getFullYear();
            return `${dia}/${mes}/${ano}`;
        }
    }

    if (strData.includes('-') && strData.length >= 10 && strData.indexOf('-') === 4) {
        const partes = strData.split(' ')[0].split('-');
        if (partes.length === 3) {
            return `${partes[2]}/${partes[1]}/${partes[0]}`;
        }
    }

    return strData;
}

// FUNÇÃO PARA VÍNCULO DOS BOTÕES (Cana Planta / Cana Soca)
function alternarCiclo(novoCiclo) {
    if (novoCiclo === "Cana Planta" || novoCiclo === "Cana Soca") {
        cicloSelecionado = novoCiclo;
        
        // Altera visualmente os títulos das colunas principais baseando-se no ciclo
        const txtTituloSemPlantio = document.querySelector('.not-planted-title');
        if (txtTituloSemPlantio) {
            txtTituloSemPlantio.innerHTML = cicloSelecionado === "Cana Planta" ? "🌱 Sem Plantio" : "🪵 Sem Corte";
        }

        // Se já houver uma planilha carregada na memória global, reprocessa os dados alterando a aba procurada
        if (planilhaWorkbookGlobal) {
            processarAbasDoWorkbook(planilhaWorkbookGlobal);
        }
    }
}

// Vincula as funções de alternar aos botões reais do seu HTML
document.addEventListener("DOMContentLoaded", () => {
    const btnPlanta = document.getElementById('btn-cana-planta');
    const btnSoca = document.getElementById('btn-cana-soca');

    if (btnPlanta) {
        btnPlanta.addEventListener('click', () => {
            document.querySelectorAll('.btn-ciclo').forEach(b => b.classList.remove('active'));
            btnPlanta.classList.add('active');
            alternarCiclo("Cana Planta");
        });
    }

    if (btnSoca) {
        btnSoca.addEventListener('click', () => {
            document.querySelectorAll('.btn-ciclo').forEach(b => b.classList.remove('active'));
            btnSoca.classList.add('active');
            alternarCiclo("Cana Soca");
        });
    }
});

// FUNÇÃO: Filtros com seleção única por clique (e Ctrl + Clique para múltiplas)
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

    propriedadesSelecionadas.clear();
    listaOrdenada.forEach(p => propriedadesSelecionadas.add(p));

    function atualizarVisualCheckboxes() {
        containerFiltros.querySelectorAll('.filtro-opcao').forEach(div => {
            const propNome = div.getAttribute('data-propriedade');
            const chk = div.querySelector('.chk-fazenda');
            if (chk) chk.checked = propriedadesSelecionadas.has(propNome);
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
        checkbox.checked = true;
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
}

// FUNÇÃO PRINCIPAL: Renderização do Kanban com os ajustes visuais de O.S. e Tipo de Plantio
function renderizarKanban(dados) {
    const colSemPlantio = document.getElementById('col-sem-plantio');
    const colPendentes = document.getElementById('col-pendentes');
    const colAndamento = document.getElementById('col-andamento');
    const colRealizadas = document.getElementById('col-realizadas');

    if (colSemPlantio) colSemPlantio.innerHTML = '';
    if (colPendentes) colPendentes.innerHTML = '';
    if (colAndamento) colAndamento.innerHTML = '';
    if (colRealizadas) colRealizadas.innerHTML = '';

    // CONFIGURAÇÃO DINÂMICA DE OPERAÇÕES BASEADA NO CICLO SELECIONADO
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

    const linesProcessadas = [];

    dados.forEach(row => {
        const codProp = row['Propriedade'] ? row['Propriedade'].toString().trim() : '';
        const fazenda = row['Fundo Agrícola'] || row['Fundo Agricola'];
        if (!fazenda) return;

        const nomeFazendaTratado = fazenda.toString().trim();
        const chaveFiltroPropriedade = codProp ? `${codProp} - ${nomeFazendaTratado}` : nomeFazendaTratado;
        if (!propriedadesSelecionadas.has(chaveFiltroPropriedade)) return;

        const talhao = row['Talhão'] || row['Talhao'] || '-';
        const areaFloat = parseFloat(row['Área Planejada'] || row['Área do Talhão'] || row['Área Plantada'] || 0) || 0;
        
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

        // DETECÇÃO PRÉVIA DO STATUS DE CADA OPERAÇÃO DESTA LINHA
        let statusGeralOps = {};
        operacoesMapeadas.forEach(op => {
            let st = (row[`Status da O.S. ${op.cod}`] || row[`Status da O.S.${op.cod}`] || '').toString().trim().toLowerCase();
            let os = (row[`OS-${op.cod}`] || row[`OS ${op.cod}`] || '').toString().trim();
            
            let temData = false;
            for (let col of op.colsDt) {
                if (row[col] !== undefined && row[col] !== '' && row[col] !== '-') {
                    temData = true;
                    break;
                }
            }
            
            let ativa = (st === 'liberada' || (os !== '' && os !== '-'));
            let realizada = (temData || st === 'encerrada' || st === 'concluida');
            
            statusGeralOps[op.cod] = { ativa, realizada, emBranco: (!ativa && !realizada) };
        });

        if (cicloSelecionado === "Cana Soca") {
            const preferência2083AtivaOuPronta = statusGeralOps['2083']?.ativa || statusGeralOps['2083']?.realizada;
            if (preferência2083AtivaOuPronta && statusGeralOps['2082']) {
                statusGeralOps['2082'] = { ativa: false, realizada: false, emBranco: false };
            }
        }

        let opsPendentesDestaLinha = [];
        let opsRealizadasDestaLinha = [];

        operacoesMapeadas.forEach(op => {
            if (cicloSelecionado === "Cana Planta") {
                const tem2078AtivaOuRealizada = statusGeralOps['2078']?.ativa || statusGeralOps['2078']?.realizada;
                if (op.cod === '2143' && statusGeralOps['2143'].emBranco && tem2078AtivaOuRealizada) return;

                const b2078EmBranco = statusGeralOps['2078']?.emBranco;
                const b2079EmBranco = statusGeralOps['2079']?.emBranco;
                const b2087EmBranco = statusGeralOps['2087']?.emBranco;
                const b2138EmBranco = statusGeralOps['2138']?.emBranco;

                if (op.cod === '2078' && b2078EmBranco && !b2079EmBranco) return;
                if (op.cod === '2079' && ((b2078EmBranco && b2079EmBranco) || (b2079EmBranco && !b2078EmBranco))) return;
                if (op.cod === '2087' && b2087EmBranco && !b2138EmBranco) return;
                if (op.cod === '2138' && ((b2087EmBranco && b2138EmBranco) || (b2138EmBranco && !b2087EmBranco))) return;
            }

            let opInfo = statusGeralOps[op.cod];
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
            const essenciais = ['2083', '2147', '2187', '2087', '2143', '2078'];
            const possuiEssencial = opsRealizadasDestaLinha.some(o => essenciais.includes(o.cod));
            if (possuiEssencial) {
                opsRealizadasDestaLinha = opsRealizadasDestaLinha.filter(o => essenciais.includes(o.cod));
            }
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

    // Estruturas de Agrupamento
    const cartoesSemPlantioAgrupados = {};
    const cartoesPendentesAgrupados = {};
    const cartoesAndamentoAgrupados = {}; 
    const cartoesRealizadasAgrupados = {};

    linesProcessadas.forEach(item => {
        if (item.tipo === 'sem_plantio') {
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
    let totalCardsPendentes = 0, totalCardsAndamento = 0, totalCardsRealizadas = 0;

    // 1. Renderização: Sem Plantio / Sem Corte (AJUSTADO)
    if (colSemPlantio) {
        Object.values(cartoesSemPlantioAgrupados).forEach(grupo => {
            totalCardsSemPlantio++;
            areaTotalSemPlantio += grupo.areaTotal;

            let textoStatusAjuda = cicloSelecionado === "Cana Planta" ? "Aguardando início do plantio." : "Aguardando colheita/corte.";
            let blocoInfoPlantioIniciado = '';

            // Se houver OS ou Operação de plantio rodando, exibe as tags limpas solicitadas
            if (grupo.numOSPlantio !== '-' || grupo.tipoOperacao !== '') {
                textoStatusAjuda = "Plantio/Operação em Andamento.";
                blocoInfoPlantioIniciado = `
                    <div style="margin-top: 5px; background: rgba(255,255,255,0.05); padding: 4px; border-radius: 4px;">
                        ${grupo.numOSPlantio !== '-' ? `<p style="font-size: 11px; color: #ffeb3b; margin: 0;"><strong>O.S.: ${grupo.numOSPlantio}</strong></p>` : ''}
                        ${grupo.tipoOperacao !== '' ? `<p style="font-size: 11px; color: #bbb; margin: 2px 0 0 0;"><strong>${grupo.tipoOperacao}</strong></p>` : ''}
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

    // 2. Renderização: Planejado (Pendentes)
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

    // 3. Renderização: Em Andamento (O.S. Liberada)
    if (colAndamento) {
        Object.values(cartoesAndamentoAgrupados).sort((a, b) => b.diasMax - a.diasMax).forEach(grupo => {
            totalCardsAndamento++;
            let blocoInfoOSHtml = grupo.numOS !== '-' ? `<p style="font-size: 12px; color: #07f743; margin: 2px 0;"><strong>O.S.: ${grupo.numOS}</strong></p>` : '';
            colAndamento.innerHTML += `
                <article class="card" style="border-left: 5px solid #2196F3;">
                    <h3>${grupo.codPropriedade ? `${grupo.codPropriedade} - ${grupo.fazenda.toUpperCase()}` : grupo.fazenda.toUpperCase()}</h3>
                    <p><strong>Talões:</strong> ${extrairStringTalhoesLimpa(grupo.talhoes)} | <strong>Área:</strong> ${grupo.areaTotal.toFixed(2)} há</p>
                    <div style="margin-top: 6px;">
                        ${blocoInfoOSHtml}
                        <p style="font-size: 12px; color: #aaa; margin: 4px 0;"><strong>Operação:</strong> ${grupo.opDesc} (${grupo.opCod})</p>
                    </div>
                    <p class="card-age">Idade Atual: <strong>${grupo.diasMax} Dias</strong></p>
                    <div class="card-badge-container"><span class="status-alert progress">⚙️ O.S. Liberada</span></div>
                </article>`;
        });
    }

    // 4. Renderização: Realizadas
    if (colRealizadas) {
        Object.values(cartoesRealizadasAgrupados).sort((a, b) => (parseInt(b.dias) || 0) - (parseInt(a.dias) || 0)).forEach(grupo => {
            totalCardsRealizadas++;
            const ultimaDataTexto = determinarUltimaDataFormatada(grupo.datasLista);
            let blocoOperacoesHtml = '<div style="margin: 6px 0; display: flex; flex-direction: column; gap: 4px;">';
            grupo.operacoes.forEach(op => {
                let txtOS = op.os !== '-' ? ` [OS: ${op.os}]` : '';
                blocoOperacoesHtml += `<p style="font-size: 12px; color: #aaa; margin: 0;">🛠️ <strong>${op.cod}</strong> - ${op.desc}<span style="color: #666; font-size: 11px;">${txtOS}</span></p>`;
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
    if (totalCardsPendentes === 0 && colPendentes) colPendentes.innerHTML = '<p class="empty-column-msg">Nenhuma área planejada.</p>';
    if (totalCardsAndamento === 0 && colAndamento) colAndamento.innerHTML = '<p class="empty-column-msg">Nenhuma área em campo.</p>';
    if (totalCardsRealizadas === 0 && colRealizadas) colRealizadas.innerHTML = '<p class="empty-column-msg">Nenhuma área encerrada.</p>';

    const txtTituloSemPlantio = document.querySelector('.not-planted-title');
    const txtTituloPendentes = document.getElementById('titulo-pendentes');
    const txtTituloAndamento = document.getElementById('titulo-andamento');
    const txtTituloRealizadas = document.getElementById('titulo-realizadas');

    if (txtTituloSemPlantio) {
        const nomeColunaBase = cicloSelecionado === "Cana Planta" ? "🌱 Sem Plantio" : "🪵 Sem Corte";
        txtTituloSemPlantio.innerHTML = `${nomeColunaBase} (${totalCardsSemPlantio}) — <strong>${areaTotalSemPlantio.toFixed(2)} há</strong>`;
    }
    if (txtTituloPendentes) txtTituloPendentes.innerHTML = `⏳ Planejado (${totalCardsPendentes})`;
    if (txtTituloAndamento) txtTituloAndamento.innerHTML = `⚙️ O.S. Liberada (${totalCardsAndamento})`;
    if (txtTituloRealizadas) txtTituloRealizadas.innerHTML = `✅ Realizadas (${totalCardsRealizadas})`;
}

// FUNÇÃO ISOLADA: Faz a releitura da aba correta e atualiza dinamicamente sem forçar download
function processarAbasDoWorkbook(wb) {
    let termoBusca = cicloSelecionado === "Cana Planta" ? "Tratos Cana Planta" : "Tratos Cana Soca";
    const nomeAbaAlvo = wb.SheetNames.find(name => name.includes(termoBusca)) || wb.SheetNames[0];
    
    const dadosJson = XLSX.utils.sheet_to_json(wb.Sheets[nomeAbaAlvo]);
    dadosOriginaisPlanilha = dadosJson;
    
    gerarFiltrosLaterais(dadosJson);
    renderizarKanban(dadosJson);
}

function processarPlanilha(arquivo) {
    const leitor = new FileReader();
    leitor.onload = function (e) {
        try {
            const dados = new Uint8Array(e.target.result);
            const workbook = XLSX.read(dados, { type: 'array', cellDates: true });
            
            planilhaWorkbookGlobal = workbook;
            processarAbasDoWorkbook(workbook);
            
            if (dropZone) dropZone.innerHTML = `✅ Quadro updated: <strong>${arquivo.name}</strong>`;
        } catch (erro) {
            alert("Erro ao ler a planilha.");
        }
    };
    leitor.readAsArrayBuffer(arquivo);
}
