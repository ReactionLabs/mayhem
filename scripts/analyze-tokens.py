#!/usr/bin/env python3
"""
Token Analytics Analysis Script
Analyzes the CSV data collected from Pump.fun token launches
"""

import pandas as pd
import sys
from pathlib import Path
from datetime import datetime

CSV_PATH = Path(__file__).parent.parent / 'data' / 'token-analytics.csv'

def load_data():
    """Load token analytics CSV"""
    if not CSV_PATH.exists():
        print(f"❌ CSV file not found at {CSV_PATH}")
        print("   Waiting for tokens to be tracked...")
        sys.exit(1)
    
    try:
        df = pd.read_csv(CSV_PATH)
        print(f"✅ Loaded {len(df)} token records\n")
        return df
    except Exception as e:
        print(f"❌ Error loading CSV: {e}")
        sys.exit(1)

def basic_stats(df):
    """Print basic statistics"""
    print("=" * 60)
    print("📊 BASIC STATISTICS")
    print("=" * 60)
    
    print(f"\nTotal Tokens Tracked: {len(df)}")
    print(f"Date Range: {df['Timestamp'].min()} to {df['Timestamp'].max()}")
    
    print("\n💰 Initial Buy-In (USD):")
    print(f"  Average: ${df['Initial Buy In (USD)'].mean():.2f}")
    print(f"  Median:  ${df['Initial Buy In (USD)'].median():.2f}")
    print(f"  Min:     ${df['Initial Buy In (USD)'].min():.2f}")
    print(f"  Max:     ${df['Initial Buy In (USD)'].max():.2f}")
    
    print("\n📈 Initial Market Cap (USD):")
    print(f"  Average: ${df['Initial Market Cap (USD)'].mean():,.2f}")
    print(f"  Median:  ${df['Initial Market Cap (USD)'].median():,.2f}")
    print(f"  Min:     ${df['Initial Market Cap (USD)'].min():,.2f}")
    print(f"  Max:     ${df['Initial Market Cap (USD)'].max():,.2f}")

def top_tokens(df, n=10):
    """Show top tokens by various metrics"""
    print("\n" + "=" * 60)
    print(f"🏆 TOP {n} TOKENS")
    print("=" * 60)
    
    print("\n💵 Highest Initial Buy-In:")
    top_buyin = df.nlargest(n, 'Initial Buy In (USD)')[
        ['Name', 'Ticker', 'Initial Buy In (USD)', 'Initial Market Cap (USD)']
    ]
    print(top_buyin.to_string(index=False))
    
    print("\n📊 Highest Initial Market Cap:")
    top_mcap = df.nlargest(n, 'Initial Market Cap (USD)')[
        ['Name', 'Ticker', 'Initial Market Cap (USD)', 'Initial Buy In (USD)']
    ]
    print(top_mcap.to_string(index=False))

def time_analysis(df):
    """Analyze tokens by time"""
    print("\n" + "=" * 60)
    print("⏰ TIME-BASED ANALYSIS")
    print("=" * 60)
    
    df['Timestamp'] = pd.to_datetime(df['Timestamp'])
    df['Hour'] = df['Timestamp'].dt.hour
    df['DayOfWeek'] = df['Timestamp'].dt.day_name()
    
    print("\n📅 Tokens by Day of Week:")
    day_counts = df['DayOfWeek'].value_counts().sort_index()
    for day, count in day_counts.items():
        print(f"  {day}: {count} tokens")
    
    print("\n🕐 Tokens by Hour (UTC):")
    hour_counts = df['Hour'].value_counts().sort_index()
    for hour, count in hour_counts.head(10).items():
        print(f"  {hour:02d}:00 - {count} tokens")

def pattern_detection(df):
    """Detect patterns in token launches"""
    print("\n" + "=" * 60)
    print("🔍 PATTERN DETECTION")
    print("=" * 60)
    
    # Tokens with high initial buy-in relative to market cap
    df['BuyInRatio'] = df['Initial Buy In (USD)'] / df['Initial Market Cap (USD)']
    high_ratio = df[df['BuyInRatio'] > 0.1].sort_values('BuyInRatio', ascending=False)
    
    if len(high_ratio) > 0:
        print(f"\n💎 Tokens with High Initial Buy-In Ratio (>10%):")
        print(f"   Found {len(high_ratio)} tokens")
        print(high_ratio[['Name', 'Ticker', 'BuyInRatio', 'Initial Buy In (USD)']].head(5).to_string(index=False))
    
    # Common ticker patterns
    print("\n📝 Most Common Ticker Patterns:")
    ticker_lengths = df['Ticker'].str.len().value_counts().sort_index()
    print("   Ticker Length Distribution:")
    for length, count in ticker_lengths.items():
        print(f"     {length} chars: {count} tokens")

def export_summary(df):
    """Export summary to file"""
    summary_path = Path(__file__).parent.parent / 'data' / 'analysis-summary.txt'
    
    with open(summary_path, 'w') as f:
        f.write("Token Analytics Summary\n")
        f.write("=" * 60 + "\n\n")
        f.write(f"Generated: {datetime.now().isoformat()}\n")
        f.write(f"Total Tokens: {len(df)}\n\n")
        f.write(f"Average Initial Buy-In: ${df['Initial Buy In (USD)'].mean():.2f}\n")
        f.write(f"Average Initial Market Cap: ${df['Initial Market Cap (USD)'].mean():,.2f}\n")
    
    print(f"\n✅ Summary exported to: {summary_path}")

def main():
    """Main analysis function"""
    print("🚀 Token Analytics Analysis")
    print("=" * 60)
    
    df = load_data()
    
    basic_stats(df)
    top_tokens(df)
    time_analysis(df)
    pattern_detection(df)
    export_summary(df)
    
    print("\n" + "=" * 60)
    print("✅ Analysis Complete!")
    print("=" * 60)

if __name__ == '__main__':
    main()

