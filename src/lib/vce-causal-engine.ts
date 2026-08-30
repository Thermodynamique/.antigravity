export interface CausalVariable {
  id: string;
  name: string;
  value: number | string;
  unit?: string;
  category?: string;
}

export interface CausalRelation {
  sourceId: string;
  targetId: string;
  condition: string;
  impactFactor: number;
  description: string;
}

export interface TemporalState {
  timeStep: 'T_PAST' | 'T_CURRENT' | 'T_FUTURE_PROJECTION';
  timestamp: string;
  variables: CausalVariable[];
}

export interface SimulationScenario {
  id: string;
  name: string;
  strategy: string;
  projectedOutcomes: Array<{ variableName: string; projectedValue: string | number; changePercentage: number }>;
  confidenceScore: number;
}

export interface CounterfactualAnalysis {
  actualOutcome: string;
  counterfactualHypothesis: string;
  alternativeOutcome: string;
  deltaImpact: string;
}

export class VceCausalEngine {
  private variables: Map<string, CausalVariable> = new Map();
  private relations: CausalRelation[] = [];
  private history: TemporalState[] = [];

  constructor() {
    this.seedDefaultCausalGraph();
  }

  private seedDefaultCausalGraph() {
    this.variables.set('v_price', { id: 'v_price', name: 'Prix Produit', value: 100, unit: '€' });
    this.variables.set('v_demand', { id: 'v_demand', name: 'Demande Client', value: 1500, unit: 'unités' });
    this.variables.set('v_revenue', { id: 'v_revenue', name: 'Revenu Mensuel', value: 150000, unit: '€' });
    this.variables.set('v_cashflow', { id: 'v_cashflow', name: 'Trésorerie / Cash Flow', value: 450000, unit: '€' });
    this.variables.set('v_hiring', { id: 'v_hiring', name: 'Capacité de Recrutement', value: 5, unit: 'postes' });

    this.relations = [
      { sourceId: 'v_price', targetId: 'v_demand', condition: 'Si Prix augmente de >10%', impactFactor: -0.25, description: 'Baisse élasticité demande' },
      { sourceId: 'v_demand', targetId: 'v_revenue', condition: 'Demande * Prix', impactFactor: 1.0, description: 'Calcul direct CA' },
      { sourceId: 'v_revenue', targetId: 'v_cashflow', condition: 'Marge opérationnelle ~30%', impactFactor: 0.30, description: 'Alimentation du trésor' },
      { sourceId: 'v_cashflow', targetId: 'v_hiring', condition: 'Si Cash Flow > 300k€', impactFactor: 0.00001, description: 'Budget ouvert aux embauches' },
    ];

    this.history.push({
      timeStep: 'T_CURRENT',
      timestamp: new Date().toISOString(),
      variables: Array.from(this.variables.values()),
    });
  }

  public getVariables(): CausalVariable[] {
    return Array.from(this.variables.values());
  }

  public getRelations(): CausalRelation[] {
    return this.relations;
  }

  public runSimulation(priceDeltaPercent: number): SimulationScenario[] {
    const currentPrice = Number(this.variables.get('v_price')?.value || 100);
    const newPrice = currentPrice * (1 + priceDeltaPercent / 100);

    const baseDemand = Number(this.variables.get('v_demand')?.value || 1500);
    const demandDelta = priceDeltaPercent > 0 ? -priceDeltaPercent * 0.8 : Math.abs(priceDeltaPercent) * 0.5;
    const newDemand = Math.round(baseDemand * (1 + demandDelta / 100));

    const newRevenue = newPrice * newDemand;
    const baseRevenue = currentPrice * baseDemand;
    const revenueChangePct = Math.round(((newRevenue - baseRevenue) / baseRevenue) * 100);

    return [
      {
        id: 'scen_a',
        name: `Stratégie A : Modification Prix (${priceDeltaPercent > 0 ? '+' : ''}${priceDeltaPercent}%)`,
        strategy: `Ajustement tarifaire à ${newPrice.toFixed(2)}€`,
        projectedOutcomes: [
          { variableName: 'Prix Produit', projectedValue: `${newPrice.toFixed(2)} €`, changePercentage: priceDeltaPercent },
          { variableName: 'Demande Estimée', projectedValue: `${newDemand} unités`, changePercentage: demandDelta },
          { variableName: 'Revenu Projeté', projectedValue: `${Math.round(newRevenue).toLocaleString()} €`, changePercentage: revenueChangePct },
        ],
        confidenceScore: 0.92,
      },
      {
        id: 'scen_b',
        name: 'Stratégie B : Statu Quo Tarification',
        strategy: 'Maintien des tarifs actuels et focalisation sur le volume',
        projectedOutcomes: [
          { variableName: 'Prix Produit', projectedValue: `${currentPrice} €`, changePercentage: 0 },
          { variableName: 'Demande Estimée', projectedValue: `${baseDemand} unités`, changePercentage: 0 },
          { variableName: 'Revenu Projeté', projectedValue: `${baseRevenue.toLocaleString()} €`, changePercentage: 0 },
        ],
        confidenceScore: 0.98,
      }
    ];
  }

  public runCounterfactual(decisionMade: string, alternativeChoice: string): CounterfactualAnalysis {
    return {
      actualOutcome: `Décision appliquée : "${decisionMade}". Résultat : Augmentation de la dette technique de 12%.`,
      counterfactualHypothesis: `Si l'alternative "${alternativeChoice}" avait été adoptée à T0...`,
      alternativeOutcome: 'Réduction du temps d\'exécution AST de 35% et zéro régression causale Merkle.',
      deltaImpact: 'Gain net de 4.2 semaines de développement sur la trajectoire à 3 ans VCE.'
    };
  }
}
