import dash
from dash import dcc, html
import plotly.express as px
import plotly.graph_objects as go
import pandas as pd
import dash_bootstrap_components as dbc

# Load financial data
financial_df = pd.read_csv('data/financial_data.csv')

def create_layout():
    """Financial Reports Dashboard Layout"""
    # Revenue vs Budget
    fig = go.Figure()
    fig.add_trace(go.Scatter(x=financial_df['month'], y=financial_df['revenue'],
                            mode='lines+markers', name='Actual Revenue'))
    fig.add_trace(go.Scatter(x=financial_df['month'], y=financial_df['budget_revenue'],
                            mode='lines+markers', name='Budget Revenue'))
    fig.update_layout(title="Revenue: Actual vs Budget")
    
    # Profit trend
    profit_fig = px.line(financial_df, x='month', y='profit',
                        title="Monthly Profit Trend")
    
    # Expenses breakdown
    expense_comparison = go.Figure()
    expense_comparison.add_trace(go.Bar(x=financial_df['month'], y=financial_df['expenses'],
                                      name='Actual Expenses'))
    expense_comparison.add_trace(go.Bar(x=financial_df['month'], y=financial_df['budget_expenses'],
                                      name='Budget Expenses'))
    expense_comparison.update_layout(title="Expenses: Actual vs Budget", barmode='group')
    
    return dbc.Container([
        html.H3("Financial Performance Reports", className="mb-4"),
        dbc.Row([
            dbc.Col([dcc.Graph(figure=fig)], width=12)
        ]),
        dbc.Row([
            dbc.Col([dcc.Graph(figure=profit_fig)], width=6),
            dbc.Col([dcc.Graph(figure=expense_comparison)], width=6)
        ]),
        dbc.Row([
            dbc.Col([
                html.H5("Financial Summary"),
                html.P(f"Total Revenue: ${financial_df['revenue'].sum():,}"),
                html.P(f"Total Profit: ${financial_df['profit'].sum():,}"),
                html.P(f"Profit Margin: {(financial_df['profit'].sum() / financial_df['revenue'].sum() * 100):.1f}%")
            ])
        ])
    ])