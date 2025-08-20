import dash
from dash import dcc, html
import plotly.express as px
import pandas as pd
import dash_bootstrap_components as dbc

# Load sales data
sales_df = pd.read_csv('data/sales_data.csv')
sales_df['date'] = pd.to_datetime(sales_df['date'])

def create_layout():
    """Sales Dashboard Layout"""
    # Revenue over time
    monthly_sales = sales_df.groupby(['date', 'region'])['revenue'].sum().reset_index()
    time_fig = px.line(monthly_sales, x='date', y='revenue', color='region',
                      title="Revenue Over Time by Region")
    
    # Product performance
    product_sales = sales_df.groupby('product')['revenue'].sum().reset_index()
    product_fig = px.bar(product_sales, x='product', y='revenue',
                        title="Total Revenue by Product")
    
    # Regional breakdown
    region_sales = sales_df.groupby('region')['revenue'].sum().reset_index()
    region_fig = px.pie(region_sales, names='region', values='revenue',
                       title="Revenue Distribution by Region")
    
    return dbc.Container([
        html.H3("Sales Performance Dashboard", className="mb-4"),
        dbc.Row([
            dbc.Col([dcc.Graph(figure=time_fig)], width=12)
        ]),
        dbc.Row([
            dbc.Col([dcc.Graph(figure=product_fig)], width=6),
            dbc.Col([dcc.Graph(figure=region_fig)], width=6)
        ]),
        dbc.Row([
            dbc.Col([
                html.H5("Sales Summary"),
                html.P(f"Total Revenue: ${sales_df['revenue'].sum():,}"),
                html.P(f"Total Units Sold: {sales_df['units_sold'].sum():,}"),
                html.P(f"Average Revenue per Unit: ${(sales_df['revenue'].sum() / sales_df['units_sold'].sum()):.2f}")
            ])
        ])
    ])